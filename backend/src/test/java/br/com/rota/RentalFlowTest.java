package br.com.rota;

import br.com.rota.dto.ApiDtos.*;
import br.com.rota.exception.ApiException;
import br.com.rota.model.*;
import br.com.rota.repository.UserRepository;
import br.com.rota.service.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest @ActiveProfiles("test") @Transactional
class RentalFlowTest {
    @Autowired AuthService auth;
    @Autowired RentalService rentals;
    @Autowired UserRepository users;
    @Autowired br.com.rota.repository.OrderRepository orders;
    UserView client, company, bank;
    VehicleView vehicle;
    final LocalDate start = LocalDate.now(ZoneId.of("America/Sao_Paulo")).plusDays(2);
    @BeforeEach void setup() {
        client = auth.register(clientInput("cliente","52998224725",List.of(new EmploymentInput("Empresa exemplo",new BigDecimal("3500.00")))));
        company = auth.register(agentInput("empresa",Role.COMPANY,"agent-test-code"));
        bank = auth.register(agentInput("banco",Role.BANK,"agent-test-code"));
        as(company); vehicle = rentals.createVehicle(new VehicleInput("RENAVAM-001",2025,"Fiat","Argo","ABC1D23",new BigDecimal("150.00"),"Econômico"));
    }
    @AfterEach void clearAuthentication() { SecurityContextHolder.clearContext(); }
    @Test void completeFinancialApprovalAndContractLifecycle() {
        var order = request();
        assertEquals(OrderStatus.PENDING,order.status()); assertEquals(new BigDecimal("450.00"),order.totalAmount());
        as(company); rentals.reviewOrder(order.id(),new ReviewInput(true,"Renda compatível com o aluguel."));
        var contract = rentals.createContract(order.id(),new ContractInput(Role.CLIENT,null));
        assertEquals(Role.CLIENT,contract.ownerType()); assertEquals(client.name(),contract.ownerName());
        assertNull(contract.credit());
        as(client); assertEquals(OrderStatus.CONTRACTED,rentals.order(order.id()).status()); assertEquals(1,rentals.contracts().size());
        assertThrows(ApiException.class,() -> rentals.cancelOrder(order.id()));
    }
    @Test void editingApprovedOrderRequiresAnotherFinancialReview() {
        var order = request(); as(company); rentals.reviewOrder(order.id(),new ReviewInput(true,"Aprovado."));
        as(client); var updated = rentals.updateOrder(order.id(),new OrderInput(vehicle.id(),start,start.plusDays(5),"Novo período"));
        assertEquals(OrderStatus.PENDING,updated.status()); assertNull(updated.reviewNotes()); assertNull(updated.reviewedByName());
        assertEquals(new BigDecimal("750.00"),updated.totalAmount());
    }
    @Test void bothAgentRolesCanModifyOrdersAndTheirChangesRequireAnotherReview() {
        for (var agent : List.of(company,bank)) {
            var order = request(); as(company); rentals.reviewOrder(order.id(),new ReviewInput(true,"Aprovado."));
            as(agent); var updated = rentals.updateOrder(order.id(),new OrderInput(vehicle.id(),start,start.plusDays(4),"Alterado por agente"));
            assertEquals(OrderStatus.PENDING,updated.status()); assertNull(updated.reviewedByName()); assertNull(updated.reviewNotes());
            assertEquals(new BigDecimal("600.00"),updated.totalAmount());
        }
    }
    @Test void pendingRequestCanBeCancelledAndCannotBeReviewedAfterwards() {
        var order = request(); as(client); assertEquals(OrderStatus.CANCELLED,rentals.cancelOrder(order.id()).status());
        as(company); assertThrows(ApiException.class,() -> rentals.reviewOrder(order.id(),new ReviewInput(true,"Aprovado.")));
    }
    @Test void clientCanOnlyReadAndModifyOwnOrders() {
        var order = request(); var other = auth.register(clientInput("outro","11144477735",List.of()));
        as(other); assertTrue(rentals.orders().isEmpty());
        assertThrows(ApiException.class,() -> rentals.order(order.id()));
        assertThrows(ApiException.class,() -> rentals.cancelOrder(order.id()));
        assertThrows(ApiException.class,() -> rentals.updateOrder(order.id(),new OrderInput(vehicle.id(),start,start.plusDays(1),"")));
        assertThrows(ApiException.class,() -> rentals.reviewOrder(order.id(),new ReviewInput(true,"Aprovado.")));
    }
    @Test void onlyAnAgentCanRegisterVehiclesOrReadOtherClientProfiles() {
        as(client);
        assertThrows(ApiException.class,() -> rentals.createVehicle(new VehicleInput("002",2024,"Fiat","Mobi","DEF2G34",new BigDecimal("80.00"),"Econômico")));
        assertThrows(ApiException.class,() -> auth.clients());
    }
    @Test void noContractWithoutFinancialApproval() {
        var order = request(); as(company);
        assertThrows(ApiException.class,() -> rentals.createContract(order.id(),new ContractInput(Role.COMPANY,null)));
        rentals.reviewOrder(order.id(),new ReviewInput(false,"Renda incompatível."));
        assertEquals(OrderStatus.REJECTED,rentals.order(order.id()).status());
        assertThrows(ApiException.class,() -> rentals.createContract(order.id(),new ContractInput(Role.COMPANY,null)));
    }
    @Test void onlyGrantingBankCanAttachCreditToContract() {
        var order = request(); as(bank); rentals.reviewOrder(order.id(),new ReviewInput(true,"Crédito aprovado."));
        var credit = new CreditInput(bank.id(),new BigDecimal("400.00"),new BigDecimal("1.5000"),4);
        as(company); assertThrows(ApiException.class,() -> rentals.createContract(order.id(),new ContractInput(Role.BANK,credit)));
        as(bank); var contract = rentals.createContract(order.id(),new ContractInput(Role.BANK,credit));
        assertEquals(bank.id(),contract.credit().bankId()); assertEquals(new BigDecimal("400.00"),contract.credit().amount());
        assertEquals(Role.BANK,contract.ownerType());
    }
    @Test void signedContractKeepsTheQuotedRateAndPartiesAfterLaterOwnershipChanges() {
        var order = request();
        as(bank); rentals.reviewOrder(order.id(),new ReviewInput(true,"Crédito aprovado."));
        rentals.updateVehicle(vehicle.id(),new VehicleInput(vehicle.registration(),vehicle.year(),vehicle.brand(),vehicle.model(),vehicle.plate(),new BigDecimal("999.00"),vehicle.category()));
        var signed = rentals.createContract(order.id(),new ContractInput(Role.CLIENT,new CreditInput(bank.id(),new BigDecimal("400.00"),new BigDecimal("1.5"),4)));
        assertEquals(new BigDecimal("150.00"),signed.vehicle().dailyRate());
        as(client); auth.updateMyProfile(new ProfileInput("Nome atualizado","MG123456","52998224725","Rua atualizada","Analista",List.of()));
        var bankUser = users.findById(bank.id()).orElseThrow(); bankUser.name = "Banco atualizado"; users.saveAndFlush(bankUser);
        var next = rentals.createOrder(new OrderInput(vehicle.id(),start.plusDays(4),start.plusDays(5),"Próximo aluguel"));
        as(bank); rentals.reviewOrder(next.id(),new ReviewInput(true,"Aprovado.")); rentals.createContract(next.id(),new ContractInput(Role.BANK,null));
        var original = rentals.contracts().stream().filter(c -> c.id().equals(signed.id())).findFirst().orElseThrow();
        assertEquals("cliente",original.clientName()); assertEquals("cliente",original.ownerName());
        assertEquals("banco",original.credit().bankName()); assertEquals(Role.CLIENT,original.vehicle().ownerType());
        assertEquals(client.id(),original.vehicle().ownerId()); assertEquals(new BigDecimal("150.00"),original.vehicle().dailyRate());
        assertEquals(Role.BANK,rentals.vehicles().stream().filter(v -> v.id().equals(vehicle.id())).findFirst().orElseThrow().ownerType());
    }
    @Test void cannotDoubleBookAnApprovedRequestOrCreateAnOverlappingRequest() {
        var first = request(); var second = request();
        as(company); rentals.reviewOrder(first.id(),new ReviewInput(true,"Aprovado.")); rentals.reviewOrder(second.id(),new ReviewInput(true,"Aprovado."));
        rentals.createContract(first.id(),new ContractInput(Role.COMPANY,null));
        assertThrows(ApiException.class,() -> rentals.createContract(second.id(),new ContractInput(Role.COMPANY,null)));
        as(client); assertThrows(ApiException.class,() -> rentals.createOrder(new OrderInput(vehicle.id(),start.plusDays(1),start.plusDays(2),"")));
        assertDoesNotThrow(() -> rentals.createOrder(new OrderInput(vehicle.id(),start.plusDays(3),start.plusDays(4),"Períodos adjacentes permitidos")));
    }
    @Test void sameDayRentalCostsOneDayAndBlocksThatDay() {
        as(client); var order = rentals.createOrder(new OrderInput(vehicle.id(),start,start,""));
        assertEquals(new BigDecimal("150.00"),order.totalAmount());
        as(company); rentals.reviewOrder(order.id(),new ReviewInput(true,"Aprovado.")); rentals.createContract(order.id(),new ContractInput(Role.COMPANY,null));
        as(client); assertThrows(ApiException.class,() -> rentals.createOrder(new OrderInput(vehicle.id(),start,start,"")));
    }
    @Test void rejectsPastAndInvertedDatesAndPreservesVehicleHistory() {
        as(client);
        assertThrows(ApiException.class,() -> rentals.createOrder(new OrderInput(vehicle.id(),start.minusDays(10),start,"")));
        assertThrows(ApiException.class,() -> rentals.createOrder(new OrderInput(vehicle.id(),start.plusDays(1),start,"")));
        request(); as(company); assertThrows(ApiException.class,() -> rentals.deleteVehicle(vehicle.id()));
    }
    @Test void identityValidationEnforcesCpfEmployerLimitAndAgentInvitation() {
        assertTrue(AuthService.validCpf("52998224725")); assertFalse(AuthService.validCpf("11111111111"));
        assertThrows(ApiException.class,() -> auth.register(clientInput("invalido","12345678900",List.of())));
        assertThrows(ApiException.class,() -> auth.register(clientInput("duplicado","52998224725",List.of())));
        var links = Collections.nCopies(4,new EmploymentInput("Empresa",new BigDecimal("1000.00")));
        assertThrows(ApiException.class,() -> auth.register(clientInput("quatro","11144477735",links)));
        assertThrows(ApiException.class,() -> auth.register(agentInput("intruso",Role.BANK,"incorreto")));
        assertTrue(users.findById(client.id()).orElseThrow().passwordHash.startsWith("$2"));
    }
    @Test void profileUpdateAndDeletionRespectActiveOrders() {
        as(client); var profile = auth.updateMyProfile(new ProfileInput("Novo nome","MG123456","529.982.247-25","Rua Nova, 42","Analista",List.of()));
        assertEquals("Novo nome",profile.name()); assertEquals("52998224725",profile.cpf());
        var order = request(); assertThrows(ApiException.class,() -> auth.deleteMe());
        rentals.cancelOrder(order.id()); auth.deleteMe();
        assertFalse(users.findById(client.id()).orElseThrow().active); assertNull(users.findById(client.id()).orElseThrow().cpf);
        assertThrows(ApiException.class,() -> auth.me());
    }
    @Test void accountDeletionIsAllowedOnTheExclusiveReturnDateAndPreservesSignedNames() {
        var order = request(); as(company); rentals.reviewOrder(order.id(),new ReviewInput(true,"Aprovado."));
        var contract = rentals.createContract(order.id(),new ContractInput(Role.CLIENT,null));
        // Simula um contrato histórico que terminou hoje, sem alterar o relógio global dos testes.
        var historical = orders.findById(order.id()).orElseThrow();
        historical.startDate = LocalDate.now(ZoneId.of("America/Sao_Paulo")).minusDays(2);
        historical.endDate = LocalDate.now(ZoneId.of("America/Sao_Paulo")); orders.saveAndFlush(historical);
        as(client); assertDoesNotThrow(() -> auth.deleteMe());
        as(company); var preserved = rentals.contracts().stream().filter(c -> c.id().equals(contract.id())).findFirst().orElseThrow();
        assertEquals("cliente",preserved.clientName()); assertEquals("cliente",preserved.ownerName());
        assertEquals("cliente",preserved.vehicle().ownerName());
    }
    @Test void sameDayContractStillBlocksAccountDeletionDuringThatDay() {
        LocalDate today = LocalDate.now(ZoneId.of("America/Sao_Paulo"));
        as(client); var order = rentals.createOrder(new OrderInput(vehicle.id(),today,today,"Uma diária"));
        as(company); rentals.reviewOrder(order.id(),new ReviewInput(true,"Aprovado.")); rentals.createContract(order.id(),new ContractInput(Role.CLIENT,null));
        as(client); assertThrows(ApiException.class,() -> auth.deleteMe());
    }
    private OrderView request() { as(client); return rentals.createOrder(new OrderInput(vehicle.id(),start,start.plusDays(3),"Aluguel para viagem.")); }
    private void as(UserView user) { SecurityContextHolder.getContext().setAuthentication(UsernamePasswordAuthenticationToken.authenticated(user.id().toString(),null,List.of(new SimpleGrantedAuthority("ROLE_"+user.role())))); }
    private RegistrationInput clientInput(String username,String cpf,List<EmploymentInput> links) { return new RegistrationInput(username,"SenhaSegura123",username,Role.CLIENT,null,"MG123456",cpf,"Rua de Teste, 10","Analista",links); }
    private RegistrationInput agentInput(String username,Role role,String code) { return new RegistrationInput(username,"SenhaSegura123",username,role,code,null,null,null,null,null); }
}
