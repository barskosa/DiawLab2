package br.com.rota;

import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.ActiveProfiles;
import tools.jackson.databind.*;
import java.net.*;
import java.net.http.*;
import java.time.*;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

/** Testa a API HTTP real, incluindo filtros de segurança, cookies e Bean Validation. */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class HttpSecurityTest {
    @LocalServerPort int port;
    @Autowired ObjectMapper json;
    private Browser browser;
    @BeforeEach void setup() { browser = new Browser(); }

    @Test void allBusinessEndpointsRequireLogin() throws Exception {
        for (var path : List.of("/vehicles","/orders","/contracts","/clients"))
            assertEquals(401,browser.call("GET",path,null,false).statusCode(),path);
    }
    @Test void csrfIsPublicButMutationWithoutTokenIsRejected() throws Exception {
        browser.csrf();
        assertEquals(403,browser.call("POST","/auth/register",clientInput(),false).statusCode());
    }
    @Test void registrationLoginCookieAndLogoutLifecycle() throws Exception {
        var data = clientInput(); browser.csrf();
        var registered = browser.call("POST","/auth/register",data,true);
        assertEquals(201,registered.statusCode(),registered.body());
        assertFalse(registered.body().contains("password"));
        var loggedIn = browser.call("POST","/auth/login",Map.of("username",data.get("username"),"password",data.get("password")),true);
        assertEquals(200,loggedIn.statusCode(),loggedIn.body()); browser.csrf();
        var me = browser.call("GET","/auth/me",null,false);
        assertEquals(200,me.statusCode()); assertEquals(data.get("username"),json.readTree(me.body()).path("username").asText());
        assertTrue(browser.cookies.getCookieStore().getCookies().stream().anyMatch(c -> c.getName().equals("JSESSIONID") && c.isHttpOnly()));
        assertEquals(204,browser.call("POST","/auth/logout",Map.of(),true).statusCode());
        assertEquals(401,browser.call("GET","/auth/me",null,false).statusCode());
    }
    @Test void wrongCredentialsDoNotEstablishSession() throws Exception {
        browser.csrf();
        assertEquals(401,browser.call("POST","/auth/login",Map.of("username","absent-user","password","wrong-password"),true).statusCode());
        assertEquals(401,browser.call("GET","/auth/me",null,false).statusCode());
    }
    @Test void dtoValidationAndCpfValidationRunBeforePersistence() throws Exception {
        browser.csrf();
        var invalid = new HashMap<>(clientInput()); invalid.put("cpf","12345678900");
        assertEquals(400,browser.call("POST","/auth/register",invalid,true).statusCode());
        invalid = new HashMap<>(clientInput()); invalid.put("employments",Collections.nCopies(4,Map.of("employer","Empresa","income",1000)));
        var tooMany = browser.call("POST","/auth/register",invalid,true);
        assertEquals(400,tooMany.statusCode()); assertTrue(tooMany.body().contains("fieldErrors"));
        invalid = new HashMap<>(clientInput()); invalid.put("password","123");
        assertEquals(400,browser.call("POST","/auth/register",invalid,true).statusCode());
        var data = clientInput(); assertEquals(201,browser.call("POST","/auth/register",data,true).statusCode());
        assertEquals(409,browser.call("POST","/auth/register",data,true).statusCode());
    }
    @Test void clientsCannotAccessAnotherClientsOrderOrAgentOperations() throws Exception {
        Browser agent = registeredAgent(Role.COMPANY);
        var vehicle = agent.call("POST","/vehicles",Map.of("registration",UUID.randomUUID().toString(),"year",2025,"brand","Fiat","model","Argo","plate",randomPlate(),"dailyRate",150,"category","Econômico"),true);
        assertEquals(201,vehicle.statusCode(),vehicle.body());
        String vehicleId = json.readTree(vehicle.body()).path("id").asText();
        Browser owner = registeredClient();
        String start = LocalDate.now(ZoneId.of("America/Sao_Paulo")).plusDays(10).toString();
        var order = owner.call("POST","/orders",Map.of("vehicleId",vehicleId,"startDate",start,"endDate",start,"notes","Teste HTTP"),true);
        assertEquals(201,order.statusCode(),order.body()); String orderId = json.readTree(order.body()).path("id").asText();
        var own = owner.call("GET","/orders/"+orderId,null,false);
        assertEquals(200,own.statusCode(),own.body());
        assertEquals(vehicleId,json.readTree(own.body()).path("vehicleId").asText());
        assertEquals("Cliente HTTP",json.readTree(own.body()).path("clientName").asText());
        Browser stranger = registeredClient();
        assertEquals(403,stranger.call("GET","/orders/"+orderId,null,false).statusCode());
        assertEquals("[]",stranger.call("GET","/orders",null,false).body());
        assertEquals(403,stranger.call("POST","/orders/"+orderId+"/review",Map.of("approved",true,"reviewNotes","Tentativa sem permissão"),true).statusCode());
        assertEquals(403,stranger.call("GET","/clients",null,false).statusCode());
    }
    @Test void agentRegistrationRequiresServerInvitation() throws Exception {
        browser.csrf();
        var input = new HashMap<String,Object>(); input.put("username","bank-"+UUID.randomUUID()); input.put("password","SenhaSegura123");
        input.put("name","Banco de teste"); input.put("role","BANK"); input.put("agentCode","incorreto");
        assertEquals(403,browser.call("POST","/auth/register",input,true).statusCode());
        input.put("agentCode","agent-test-code"); assertEquals(201,browser.call("POST","/auth/register",input,true).statusCode());
    }
    @Test void anOldSessionCannotTakeOverAnAccountThatReusesADeletedUsername() throws Exception {
        var input = clientInput();
        Browser original = registerAndLogin(input);
        String originalId = json.readTree(original.call("GET","/auth/me",null,false).body()).path("id").asText();
        Browser oldSession = new Browser(); oldSession.csrf();
        assertEquals(200,oldSession.call("POST","/auth/login",Map.of("username",input.get("username"),"password",input.get("password")),true).statusCode());
        oldSession.csrf();
        assertEquals(204,original.call("DELETE","/clients/me",null,true).statusCode());
        Browser replacement = registerAndLogin(input);
        String replacementId = json.readTree(replacement.call("GET","/auth/me",null,false).body()).path("id").asText();
        assertNotEquals(originalId,replacementId);
        assertEquals(401,oldSession.call("GET","/auth/me",null,false).statusCode());
        assertEquals(401,oldSession.call("GET","/orders",null,false).statusCode());
    }
    @Test void invalidRoutesMethodsAndContentTypesKeepTheirHttpStatus() throws Exception {
        Browser b = registeredClient();
        assertEquals(404,b.call("GET","/unknown-resource",null,false).statusCode());
        var method = b.call("GET","/auth/login",null,false);
        assertEquals(405,method.statusCode()); assertTrue(method.headers().firstValue("Allow").orElse("").contains("POST"));
        b.csrf();
        var unsupported = HttpRequest.newBuilder(URI.create("http://localhost:"+port+"/api/auth/register"))
                .header("Content-Type","application/xml").header(b.header,b.token)
                .POST(HttpRequest.BodyPublishers.ofString("<user/>"));
        assertEquals(415,b.http.send(unsupported.build(),HttpResponse.BodyHandlers.ofString()).statusCode());
    }
    @Test void invalidDatabaseTextAndExtremeDatesReturn400InsteadOf500() throws Exception {
        browser.csrf(); var invalid = new HashMap<>(clientInput()); invalid.put("name","Nome\u0000Inválido");
        assertEquals(400,browser.call("POST","/auth/register",invalid,true).statusCode());
        Browser agent = registeredAgent(Role.COMPANY);
        var vehicleInput = new HashMap<String,Object>(Map.of("registration","ß".repeat(60),"year",2025,"brand","Fiat","model","Argo","plate",randomPlate(),"dailyRate",150,"category","Econômico"));
        assertEquals(400,agent.call("POST","/vehicles",vehicleInput,true).statusCode());
        vehicleInput.put("registration",UUID.randomUUID().toString()); vehicleInput.put("model","Argo\u0000Inválido");
        assertEquals(400,agent.call("POST","/vehicles",vehicleInput,true).statusCode());
        vehicleInput.put("model","Argo");
        var createdVehicle = agent.call("POST","/vehicles",vehicleInput,true);
        assertEquals(201,createdVehicle.statusCode(),createdVehicle.body());
        String vehicleId = json.readTree(createdVehicle.body()).path("id").asText();
        Browser client = registeredClient();
        var dates = Map.of("vehicleId",vehicleId,"startDate","+999999999-12-31","endDate","+999999999-12-31","notes","");
        assertEquals(400,client.call("POST","/orders",dates,true).statusCode());
        String start = LocalDate.now(ZoneId.of("America/Sao_Paulo")).plusDays(2).toString();
        assertEquals(400,client.call("POST","/orders",Map.of("vehicleId",vehicleId,"startDate",start,"endDate",start,"notes","Texto\u0000Inválido"),true).statusCode());
    }
    @Test void fullRentalLifecycleLoadsAssociationsAcrossIndependentHttpTransactions() throws Exception {
        Browser agent = registeredAgent(Role.BANK);
        var agentMe = json.readTree(agent.call("GET","/auth/me",null,false).body());
        String bankId = agentMe.path("id").asText();
        var createdVehicle = agent.call("POST","/vehicles",Map.of("registration",UUID.randomUUID().toString(),"year",2025,"brand","Honda","model","City","plate",randomPlate(),"dailyRate",200,"category","Sedan"),true);
        assertEquals(201,createdVehicle.statusCode(),createdVehicle.body());
        String vehicleId = json.readTree(createdVehicle.body()).path("id").asText();
        var fleet = agent.call("GET","/vehicles",null,false);
        assertEquals(200,fleet.statusCode(),fleet.body());
        var fleetVehicle = findById(json.readTree(fleet.body()),vehicleId);
        assertEquals("Agente HTTP",fleetVehicle.path("ownerName").asText());
        assertEquals(bankId,fleetVehicle.path("ownerId").asText());
        assertEquals("BANK",fleetVehicle.path("ownerType").asText());

        Browser client = registeredClient();
        String clientId = json.readTree(client.call("GET","/auth/me",null,false).body()).path("id").asText();
        LocalDate start = LocalDate.now(ZoneId.of("America/Sao_Paulo")).plusDays(15);
        var createdOrder = client.call("POST","/orders",Map.of("vehicleId",vehicleId,"startDate",start.toString(),"endDate",start.plusDays(2).toString(),"notes","Reserva HTTP completa"),true);
        assertEquals(201,createdOrder.statusCode(),createdOrder.body());
        String orderId = json.readTree(createdOrder.body()).path("id").asText();
        var ownGet = client.call("GET","/orders/"+orderId,null,false);
        assertEquals(200,ownGet.statusCode(),ownGet.body());
        assertEquals(clientId,json.readTree(ownGet.body()).path("clientId").asText());
        var clientOrders = client.call("GET","/orders",null,false);
        assertEquals(200,clientOrders.statusCode(),clientOrders.body());
        var order = findById(json.readTree(clientOrders.body()),orderId);
        assertEquals("Cliente HTTP",order.path("clientName").asText());
        assertEquals("Honda",order.path("vehicle").path("brand").asText());
        assertEquals("City",order.path("vehicle").path("model").asText());
        assertEquals(bankId,order.path("vehicle").path("ownerId").asText());

        var updated = client.call("PUT","/orders/"+orderId,Map.of("vehicleId",vehicleId,"startDate",start.toString(),"endDate",start.plusDays(3).toString(),"notes","Período ampliado"),true);
        assertEquals(200,updated.statusCode(),updated.body());
        assertEquals(600,json.readTree(updated.body()).path("totalAmount").asInt());
        var reviewed = agent.call("POST","/orders/"+orderId+"/review",Map.of("approved",true,"reviewNotes","Renda analisada e crédito aprovado."),true);
        assertEquals(200,reviewed.statusCode(),reviewed.body());
        var afterReview = client.call("GET","/orders/"+orderId,null,false);
        assertEquals(200,afterReview.statusCode(),afterReview.body());
        assertEquals("APPROVED",json.readTree(afterReview.body()).path("status").asText());
        assertEquals("Agente HTTP",json.readTree(afterReview.body()).path("reviewedByName").asText());

        var createdContract = agent.call("POST","/orders/"+orderId+"/contract",Map.of("ownerType","CLIENT","credit",Map.of("bankId",bankId,"amount",500,"interestRate",1.5,"installments",5)),true);
        assertEquals(201,createdContract.statusCode(),createdContract.body());
        String contractId = json.readTree(createdContract.body()).path("id").asText();
        // Atualizações cadastrais posteriores não podem reescrever o documento assinado.
        var profile = json.readTree(client.call("GET","/clients/me",null,false).body());
        var changedClient = client.call("PUT","/clients/me",Map.of("name","Nome atualizado","rg",profile.path("rg").asText(),"cpf",profile.path("cpf").asText(),"address",profile.path("address").asText(),"profession",profile.path("profession").asText(),"employments",List.of()),true);
        assertEquals(200,changedClient.statusCode(),changedClient.body());
        var changedVehicle = agent.call("PUT","/vehicles/"+vehicleId,Map.of("registration",UUID.randomUUID().toString(),"year",2026,"brand","Honda","model","Civic","plate",randomPlate(),"dailyRate",999,"category","Sedan atualizado"),true);
        assertEquals(200,changedVehicle.statusCode(),changedVehicle.body());
        assertEquals("Civic",json.readTree(changedVehicle.body()).path("model").asText());
        for (var viewer : List.of(client,agent)) {
            var contractsResponse = viewer.call("GET","/contracts",null,false);
            assertEquals(200,contractsResponse.statusCode(),contractsResponse.body());
            var contract = findById(json.readTree(contractsResponse.body()),contractId);
            assertEquals(orderId,contract.path("orderId").asText());
            assertEquals("Cliente HTTP",contract.path("clientName").asText());
            assertEquals("CLIENT",contract.path("ownerType").asText());
            assertEquals("Cliente HTTP",contract.path("ownerName").asText());
            assertEquals("City",contract.path("vehicle").path("model").asText());
            assertEquals(2025,contract.path("vehicle").path("year").asInt());
            assertEquals(200,contract.path("vehicle").path("dailyRate").asInt());
            assertEquals("Sedan",contract.path("vehicle").path("category").asText());
            assertEquals("Cliente HTTP",contract.path("vehicle").path("ownerName").asText());
            assertEquals(clientId,contract.path("vehicle").path("ownerId").asText());
            assertEquals(bankId,contract.path("credit").path("bankId").asText());
            assertEquals("Agente HTTP",contract.path("credit").path("bankName").asText());
            assertEquals(500,contract.path("credit").path("amount").asInt());
            assertEquals(5,contract.path("credit").path("installments").asInt());
        }
        var contractedOrder = client.call("GET","/orders/"+orderId,null,false);
        assertEquals(200,contractedOrder.statusCode(),contractedOrder.body());
        assertEquals("CONTRACTED",json.readTree(contractedOrder.body()).path("status").asText());
        var clientProfile = agent.call("GET","/clients/"+clientId,null,false);
        assertEquals(200,clientProfile.statusCode(),clientProfile.body());
        assertEquals("Nome atualizado",json.readTree(clientProfile.body()).path("name").asText());
    }
    private JsonNode findById(JsonNode rows,String id) {
        for (JsonNode row : rows) if (row.path("id").asText().equals(id)) return row;
        fail("Registro ausente na resposta: "+id+" em "+rows); return null;
    }
    private Browser registeredClient() throws Exception { return registerAndLogin(clientInput()); }
    private Browser registeredAgent(Role role) throws Exception {
        return registerAndLogin(Map.of("username","agent-"+UUID.randomUUID(),"password","SenhaSegura123","name","Agente HTTP","role",role.name(),"agentCode","agent-test-code"));
    }
    private Browser registerAndLogin(Map<String,Object> data) throws Exception {
        Browser b = new Browser(); b.csrf(); var registered = b.call("POST","/auth/register",data,true);
        assertEquals(201,registered.statusCode(),registered.body());
        var login = b.call("POST","/auth/login",Map.of("username",data.get("username"),"password",data.get("password")),true);
        assertEquals(200,login.statusCode(),login.body()); b.csrf(); return b;
    }
    private Map<String,Object> clientInput() {
        return Map.of("username","client-"+UUID.randomUUID(),"password","SenhaSegura123","name","Cliente HTTP","role","CLIENT",
                "rg","MG123456","cpf",randomCpf(),"address","Rua de Teste, 10","profession","Analista","employments",List.of());
    }
    private static String randomPlate() { int value = new Random().nextInt(100000); return "TST" + (value/10000) + (char)('A'+(value/100)%26) + String.format("%02d",value%100); }
    private static String randomCpf() {
        String digits = String.format("%09d",new Random().nextInt(1_000_000_000));
        for (int length=9;length<=10;length++) {
            int sum=0; for(int i=0;i<length;i++) sum+=(digits.charAt(i)-'0')*(length+1-i);
            int check=11-sum%11; digits += check >= 10 ? "0" : String.valueOf(check);
        }
        return digits;
    }
    private final class Browser {
        final CookieManager cookies = new CookieManager(null,CookiePolicy.ACCEPT_ALL);
        final HttpClient http = HttpClient.newBuilder().cookieHandler(cookies).build();
        String token,header;
        void csrf() throws Exception {
            var response=call("GET","/auth/csrf",null,false); assertEquals(200,response.statusCode(),response.body());
            var body=json.readTree(response.body()); token=body.path("token").asText(); header=body.path("headerName").asText(); assertFalse(token.isBlank());
        }
        HttpResponse<String> call(String method,String path,Object body,boolean withToken) throws Exception {
            var request=HttpRequest.newBuilder(URI.create("http://localhost:"+port+"/api"+path)).header("Content-Type","application/json");
            if(withToken) request.header(header,token);
            request.method(method,body==null?HttpRequest.BodyPublishers.noBody():HttpRequest.BodyPublishers.ofString(json.writeValueAsString(body)));
            return http.send(request.build(),HttpResponse.BodyHandlers.ofString());
        }
    }
    private enum Role { COMPANY, BANK }
}
