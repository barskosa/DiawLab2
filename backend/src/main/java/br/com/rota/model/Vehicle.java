package br.com.rota.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.util.UUID;

@Entity @Table(name = "vehicles")
public class Vehicle {
    @Id @GeneratedValue(strategy = GenerationType.UUID) public UUID id;
    @Column(nullable = false, unique = true, length = 60) public String registration;
    @Column(name = "manufacture_year", nullable = false) public int year;
    @Column(nullable = false, length = 80) public String brand;
    @Column(nullable = false, length = 100) public String model;
    @Column(nullable = false, unique = true, length = 8) public String plate;
    @Column(nullable = false, precision = 14, scale = 2) public BigDecimal dailyRate;
    @Column(nullable = false, length = 60) public String category;
    // Os DTOs acessam os campos públicos; relações to-one precisam de instâncias carregadas.
    @ManyToOne(optional = false, fetch = FetchType.EAGER) public AppUser owner;
    @Version public long version;
}
