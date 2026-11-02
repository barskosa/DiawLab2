package br.com.rota.model;

import jakarta.persistence.*;
import java.util.*;

@Entity @Table(name = "app_users")
public class AppUser {
    @Id @GeneratedValue(strategy = GenerationType.UUID) public UUID id;
    @Column(nullable = false, unique = true, length = 80) public String username;
    @Column(nullable = false, length = 100) public String passwordHash;
    @Column(nullable = false, length = 150) public String name;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) public Role role;
    @Column(length = 30) public String rg;
    @Column(unique = true, length = 11) public String cpf;
    @Column(length = 500) public String address;
    @Column(length = 120) public String profession;
    @Column(nullable = false) public boolean active = true;
    @Version public long version;
    @ElementCollection @CollectionTable(name = "employments", joinColumns = @JoinColumn(name = "client_id"))
    @OrderColumn(name = "position") public List<Employment> employments = new ArrayList<>();
}
