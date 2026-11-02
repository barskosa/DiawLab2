package br.com.rota.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.*;
import java.util.UUID;

@Entity @Table(name = "rental_contracts")
public class RentalContract {
    @Id @GeneratedValue(strategy = GenerationType.UUID) public UUID id;
    @OneToOne(optional = false, fetch = FetchType.EAGER) @JoinColumn(unique = true, nullable = false) public RentalOrder order;
    @ManyToOne(optional = false, fetch = FetchType.EAGER) public AppUser owner;
    @Column(nullable = false) public Instant signedAt = Instant.now();
    @ManyToOne(fetch = FetchType.EAGER) public AppUser bank;
    @Column(precision = 14, scale = 2) public BigDecimal creditAmount;
    @Column(precision = 8, scale = 4) public BigDecimal interestRate;
    public Integer installments;
}
