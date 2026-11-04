package br.com.rota;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.security.autoconfigure.UserDetailsServiceAutoConfiguration;

// O login é implementado por AuthService; não criar uma segunda conta automática em memória.
@SpringBootApplication(exclude = UserDetailsServiceAutoConfiguration.class)
public class RotaApplication {
    public static void main(String[] args) { SpringApplication.run(RotaApplication.class, args); }
}
