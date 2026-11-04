package br.com.rota;

import br.com.rota.dto.ApiDtos.*;
import br.com.rota.exception.ApiException;
import br.com.rota.model.*;
import br.com.rota.repository.*;
import br.com.rota.service.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import java.util.concurrent.*;
import static org.junit.jupiter.api.Assertions.*;

/** Transações reais em threads distintas: não usa a transação compartilhada de um teste @Transactional. */
@SpringBootTest @ActiveProfiles("test")
class ConcurrentRentalTest {
    @Autowired AuthService auth;
    @Autowired RentalService rentals;
    @Autowired UserRepository users;
    @Autowired OrderRepository orders;
    @Autowired PlatformTransactionManager transactionManager;
    UserView client,company;
    VehicleView vehicle;
    final LocalDate start = LocalDate.now(ZoneId.of("America/Sao_Paulo")).plusDays(5);
    @BeforeEach void setup() {
        String suffix = UUID.randomUUID().toString();
        client = auth.register(new RegistrationInput("client-"+suffix,"SenhaSegura123","Cliente concorrência",Role.CLIENT,null,"MG123456",randomCpf(),"Rua de Teste, 10","Analista",List.of()));
        company = auth.register(new RegistrationInput("agent-"+suffix,"SenhaSegura123","Empresa concorrência",Role.COMPANY,"agent-test-code",null,null,null,null,null));
        as(company);
        String plate = "CON"+(new Random().nextInt(9000)+1000);
        vehicle = rentals.createVehicle(new VehicleInput(suffix,2025,"Fiat","Argo",plate,new BigDecimal("100.00"),"Econômico"));
    }
    @AfterEach void clearContext() { SecurityContextHolder.clearContext(); }

    @Test void simultaneousContractsCannotReserveTheSameVehicleTwice() throws Exception {
        as(client);
        var first = rentals.createOrder(new OrderInput(vehicle.id(),start,start.plusDays(2),"Primeiro"));
        var second = rentals.createOrder(new OrderInput(vehicle.id(),start,start.plusDays(2),"Segundo"));
        as(company); rentals.reviewOrder(first.id(),new ReviewInput(true,"Aprovado.")); rentals.reviewOrder(second.id(),new ReviewInput(true,"Aprovado."));
        var ready = new CountDownLatch(2); var go = new CountDownLatch(1);
        try (var pool = Executors.newFixedThreadPool(2)) {
            List<Future<String>> attempts = new ArrayList<>();
            for (var id : List.of(first.id(),second.id())) attempts.add(pool.submit(() -> {
                as(company); ready.countDown(); await(go);
                try { rentals.createContract(id,new ContractInput(Role.COMPANY,null)); return "CREATED"; }
                catch (ApiException error) { assertEquals(HttpStatus.CONFLICT,error.status); return "CONFLICT"; }
                catch (OptimisticLockingFailureException error) { return "CONFLICT"; }
                finally { SecurityContextHolder.clearContext(); }
            }));
            assertTrue(ready.await(5,TimeUnit.SECONDS)); go.countDown();
            var outcomes = List.of(attempts.get(0).get(10,TimeUnit.SECONDS),attempts.get(1).get(10,TimeUnit.SECONDS));
            assertEquals(1,Collections.frequency(outcomes,"CREATED"));
            assertEquals(1,Collections.frequency(outcomes,"CONFLICT"));
        }
        as(company);
        Set<UUID> testedOrders = Set.of(first.id(),second.id());
        assertEquals(1,rentals.contracts().stream().filter(c -> testedOrders.contains(c.orderId())).count());
        assertEquals(Set.of(OrderStatus.APPROVED,OrderStatus.CONTRACTED),Set.of(rentals.order(first.id()).status(),rentals.order(second.id()).status()));
    }

    @Test void deletionAndNewOrderAreSerializedOnTheClientIdentity() throws Exception {
        var userLocked = new CountDownLatch(1); var allowDelete = new CountDownLatch(1); var creationStarted = new CountDownLatch(1);
        var transactions = new TransactionTemplate(transactionManager);
        try (var pool = Executors.newFixedThreadPool(2)) {
            var deletion = pool.submit(() -> {
                as(client);
                try {
                    transactions.executeWithoutResult(status -> {
                        users.findLocked(client.id()).orElseThrow(); userLocked.countDown(); await(allowDelete);
                        auth.deleteMe();
                    });
                } finally { SecurityContextHolder.clearContext(); }
            });
            assertTrue(userLocked.await(5,TimeUnit.SECONDS));
            var creation = pool.submit(() -> {
                as(client); creationStarted.countDown();
                try { return rentals.createOrder(new OrderInput(vehicle.id(),start,start.plusDays(2),"Corrida com exclusão")); }
                finally { SecurityContextHolder.clearContext(); }
            });
            try {
                assertTrue(creationStarted.await(5,TimeUnit.SECONDS));
                assertThrows(TimeoutException.class,() -> creation.get(150,TimeUnit.MILLISECONDS));
            } finally { allowDelete.countDown(); }
            deletion.get(10,TimeUnit.SECONDS);
            var failure = assertThrows(ExecutionException.class,() -> creation.get(10,TimeUnit.SECONDS));
            var error = assertInstanceOf(ApiException.class,failure.getCause()); assertEquals(HttpStatus.UNAUTHORIZED,error.status);
        }
        assertFalse(users.findById(client.id()).orElseThrow().active);
        assertTrue(orders.findByClientIdOrderByCreatedAtDesc(client.id()).isEmpty());
    }
    private static void as(UserView user) {
        SecurityContextHolder.getContext().setAuthentication(UsernamePasswordAuthenticationToken.authenticated(user.id().toString(),null,List.of(new SimpleGrantedAuthority("ROLE_"+user.role()))));
    }
    private static void await(CountDownLatch latch) {
        try { if (!latch.await(5,TimeUnit.SECONDS)) throw new IllegalStateException("Tempo de sincronização excedido."); }
        catch (InterruptedException error) { Thread.currentThread().interrupt(); throw new IllegalStateException(error); }
    }
    private static String randomCpf() {
        String digits = String.format("%09d",new Random().nextInt(1_000_000_000));
        for (int length=9;length<=10;length++) {
            int sum=0; for(int i=0;i<length;i++) sum+=(digits.charAt(i)-'0')*(length+1-i);
            int check=11-sum%11; digits += check >= 10 ? "0" : String.valueOf(check);
        }
        return digits;
    }
}
