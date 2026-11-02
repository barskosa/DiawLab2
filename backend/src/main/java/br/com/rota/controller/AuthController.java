package br.com.rota.controller;

import br.com.rota.dto.ApiDtos.*;
import br.com.rota.service.AuthService;
import jakarta.servlet.http.*;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController @RequestMapping("/api/auth")
public class AuthController {
    private final AuthService auth;
    public AuthController(AuthService auth) { this.auth = auth; }
    @GetMapping("/csrf") public Map<String,String> csrf(CsrfToken token) { return Map.of("token",token.getToken(),"headerName",token.getHeaderName()); }
    @PostMapping("/register") @ResponseStatus(HttpStatus.CREATED) public UserView register(@Valid @RequestBody RegistrationInput input) { return auth.register(input); }
    @PostMapping("/login") public UserView login(@Valid @RequestBody LoginInput input, HttpServletRequest request, HttpServletResponse response) { return auth.login(input,request,response); }
    @GetMapping("/me") public UserView me() { return auth.me(); }
    @PostMapping("/logout") @ResponseStatus(HttpStatus.NO_CONTENT) public void logout(HttpServletRequest request, HttpServletResponse response) { auth.logout(request,response); }
}
