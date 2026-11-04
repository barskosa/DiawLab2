package br.com.rota.service;

import br.com.rota.dto.ApiDtos.*;
import br.com.rota.exception.ApiException;
import br.com.rota.model.*;
import br.com.rota.repository.*;
import jakarta.servlet.http.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CsrfTokenRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.*;

@Service @Transactional
public class AuthService {
    private final UserRepository users;
    private final OrderRepository orders;
    private final ContractRepository contracts;
    private final PasswordEncoder passwords;
    private final SecurityContextRepository contexts;
    private final CsrfTokenRepository csrf;
    private final String agentCode;
    public AuthService(UserRepository users, OrderRepository orders, ContractRepository contracts,
            PasswordEncoder passwords, SecurityContextRepository contexts, CsrfTokenRepository csrf,
            @Value("${app.agent-registration-code}") String agentCode) {
        this.users = users; this.orders = orders; this.contracts = contracts; this.passwords = passwords;
        this.contexts = contexts; this.csrf = csrf; this.agentCode = agentCode;
    }
    public UserView register(RegistrationInput input) {
        required(input.name(),150,"Nome");
        String username = input.username().trim().toLowerCase(Locale.ROOT);
        if (users.existsByUsername(username)) throw ApiException.conflict("Este nome de usuário já está cadastrado.");
        if (input.password().getBytes(StandardCharsets.UTF_8).length > 72)
            throw ApiException.badRequest("A senha deve ocupar no máximo 72 bytes UTF-8.");
        if (input.role() != Role.CLIENT && (agentCode.isBlank() || input.agentCode() == null ||
                !MessageDigest.isEqual(agentCode.getBytes(StandardCharsets.UTF_8), input.agentCode().getBytes(StandardCharsets.UTF_8))))
            throw new ApiException(HttpStatus.FORBIDDEN, "Código de cadastro de agente inválido ou não configurado pelo responsável.");
        var user = new AppUser(); user.username = username; user.name = input.name().trim();
        user.role = input.role(); user.passwordHash = passwords.encode(input.password());
        if (user.role == Role.CLIENT) applyProfile(user, new ProfileInput(input.name(), input.rg(), input.cpf(), input.address(), input.profession(), input.employments() == null ? List.of() : input.employments()));
        return userView(users.saveAndFlush(user));
    }
    public UserView login(LoginInput input, HttpServletRequest request, HttpServletResponse response) {
        var user = users.findByUsername(input.username().trim().toLowerCase(Locale.ROOT));
        if (user.isEmpty() || !user.get().active || input.password().getBytes(StandardCharsets.UTF_8).length > 72 || !passwords.matches(input.password(), user.get().passwordHash))
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Usuário ou senha incorretos.");
        if (request.getSession(false) != null) request.changeSessionId();
        var context = SecurityContextHolder.createEmptyContext();
        // A identidade de uma sessão não pode ser reciclada junto com o nome de usuário.
        context.setAuthentication(UsernamePasswordAuthenticationToken.authenticated(user.get().id.toString(), null,
                List.of(new SimpleGrantedAuthority("ROLE_" + user.get().role.name()))));
        SecurityContextHolder.setContext(context); contexts.saveContext(context, request, response);
        csrf.saveToken(null, request, response);
        return userView(user.get());
    }
    public void logout(HttpServletRequest request, HttpServletResponse response) {
        csrf.saveToken(null, request, response);
        var session = request.getSession(false); if (session != null) session.invalidate();
        SecurityContextHolder.clearContext();
    }
    @Transactional(readOnly = true)
    public AppUser current() {
        return users.findById(currentId()).filter(u -> u.active).orElseThrow(AuthService::unauthenticated);
    }
    public AppUser currentForUpdate() {
        // Serializa exclusão/edição da conta e criação de pedidos do mesmo titular.
        return users.findLocked(currentId()).filter(u -> u.active).orElseThrow(AuthService::unauthenticated);
    }
    private UUID currentId() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) throw unauthenticated();
        try { return UUID.fromString(authentication.getName()); }
        catch (IllegalArgumentException ex) { throw unauthenticated(); }
    }
    private static ApiException unauthenticated() { return new ApiException(HttpStatus.UNAUTHORIZED, "Faça login para continuar."); }
    public static void requireAgent(AppUser user) { if (user.role == Role.CLIENT) throw ApiException.forbidden(); }
    public static void requireClient(AppUser user) { if (user.role != Role.CLIENT) throw ApiException.forbidden(); }
    public UserView me() { return userView(current()); }
    public ClientView myProfile() { var user = current(); requireClient(user); return clientView(user); }
    public ClientView updateMyProfile(ProfileInput input) { var user = currentForUpdate(); requireClient(user); applyProfile(user,input); return clientView(users.saveAndFlush(user)); }
    public List<ClientView> clients() { requireAgent(current()); return users.findByRoleAndActiveTrueOrderByNameAsc(Role.CLIENT).stream().map(AuthService::clientView).toList(); }
    public ClientView client(UUID id) { requireAgent(current()); return clientView(findClient(id)); }
    public ClientView updateClient(UUID id, ProfileInput input) {
        requireAgent(current());
        var client = users.findLocked(id).filter(u -> u.active && u.role == Role.CLIENT).orElseThrow(() -> ApiException.notFound("Cliente"));
        applyProfile(client,input); return clientView(users.saveAndFlush(client));
    }
    private AppUser findClient(UUID id) { return users.findById(id).filter(u -> u.active && u.role == Role.CLIENT).orElseThrow(() -> ApiException.notFound("Cliente")); }
    public List<BankView> banks() { current(); return users.findByRoleAndActiveTrueOrderByNameAsc(Role.BANK).stream().map(u -> new BankView(u.id,u.name)).toList(); }
    public void deleteMe() {
        var user = currentForUpdate(); requireClient(user);
        boolean activeOrders = orders.existsByClientIdAndStatusIn(user.id,List.of(OrderStatus.PENDING,OrderStatus.APPROVED));
        boolean activeContracts = contracts.findByOrderClientIdOrderBySignedAtDesc(user.id).stream()
                .anyMatch(c -> RentalDates.endExclusive(c.order.startDate,c.order.endDate).isAfter(RentalDates.today()));
        if (activeOrders || activeContracts) throw ApiException.conflict("Cancele os pedidos em aberto e aguarde o encerramento dos contratos antes de excluir sua conta.");
        // Exclui os dados pessoais e desativa a identidade, preservando a integridade do histórico contratual.
        user.active = false; user.username = "$deleted$" + user.id; user.name = "Cliente removido";
        user.passwordHash = passwords.encode(UUID.randomUUID().toString()); user.cpf = null; user.rg = null;
        user.address = null; user.profession = null; user.employments.clear(); users.saveAndFlush(user);
    }
    private void applyProfile(AppUser user, ProfileInput input) {
        required(input.name(),150,"Nome"); required(input.rg(),30,"RG"); required(input.address(),500,"Endereço"); required(input.profession(),120,"Profissão");
        String cpf = input.cpf() == null ? "" : input.cpf().replaceAll("[.\\-\\s]", "");
        if (!validCpf(cpf)) throw ApiException.badRequest("Informe um CPF válido.");
        if (users.existsByCpfAndIdNot(cpf,user.id == null ? new UUID(0,0) : user.id)) throw ApiException.conflict("Este CPF já está cadastrado.");
        var employmentInputs = input.employments() == null ? List.<EmploymentInput>of() : input.employments();
        if (employmentInputs.size() > 3) throw ApiException.badRequest("São permitidas até três entidades empregadoras.");
        for (var e : employmentInputs) {
            if (e == null) throw ApiException.badRequest("Vínculo empregatício inválido.");
            required(e.employer(),150,"Entidade empregadora");
            if (e.income() == null || e.income().compareTo(BigDecimal.ZERO) <= 0 || e.income().scale() > 2 || e.income().precision() - e.income().scale() > 12)
                throw ApiException.badRequest("Informe um rendimento positivo com até duas casas decimais.");
        }
        user.name = input.name().trim(); user.rg = input.rg().trim(); user.cpf = cpf;
        user.address = input.address().trim(); user.profession = input.profession().trim();
        user.employments.clear(); employmentInputs.forEach(e -> user.employments.add(new Employment(e.employer().trim(),e.income())));
    }
    private static void required(String value, int max, String label) {
        if (value == null || value.isBlank() || value.length() > max || value.indexOf('\0') >= 0)
            throw ApiException.badRequest(label + " é obrigatório e deve conter até " + max + " caracteres válidos.");
    }
    public static boolean validCpf(String cpf) {
        if (cpf == null || !cpf.matches("\\d{11}") || cpf.chars().distinct().count() == 1) return false;
        for (int length = 9; length <= 10; length++) {
            int sum = 0; for (int i = 0; i < length; i++) sum += (cpf.charAt(i) - '0') * (length + 1 - i);
            int digit = 11 - sum % 11; if (digit >= 10) digit = 0;
            if (digit != cpf.charAt(length) - '0') return false;
        }
        return true;
    }
    public static UserView userView(AppUser user) { return new UserView(user.id,user.username,user.name,user.role); }
    public static ClientView clientView(AppUser user) { return new ClientView(user.id,user.username,user.name,user.rg,user.cpf,user.address,user.profession,user.employments.stream().map(e -> new EmploymentInput(e.employer,e.income)).toList()); }
}
