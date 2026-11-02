package br.com.rota.controller;

import br.com.rota.dto.ApiDtos.*;
import br.com.rota.service.AuthService;
import jakarta.servlet.http.*;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController @RequestMapping("/api/clients")
public class ClientController {
    private final AuthService auth;
    public ClientController(AuthService auth) { this.auth = auth; }
    @GetMapping("/me") public ClientView me() { return auth.myProfile(); }
    @PutMapping("/me") public ClientView updateMe(@Valid @RequestBody ProfileInput input) { return auth.updateMyProfile(input); }
    @DeleteMapping("/me") @ResponseStatus(HttpStatus.NO_CONTENT) public void deleteMe(HttpServletRequest request, HttpServletResponse response) { auth.deleteMe(); auth.logout(request,response); }
    @GetMapping public List<ClientView> clients() { return auth.clients(); }
    @GetMapping("/{id}") public ClientView client(@PathVariable UUID id) { return auth.client(id); }
    @PutMapping("/{id}") public ClientView updateClient(@PathVariable UUID id,@Valid @RequestBody ProfileInput input) { return auth.updateClient(id,input); }
}
