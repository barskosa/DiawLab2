package br.com.rota.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.*;
import java.util.UUID;

@Entity @Table(name = "rental_orders")
public class RentalOrder {
    @Id @GeneratedValue(strategy = GenerationType.UUID) public UUID id;
    @ManyToOne(optional = false, fetch = FetchType.EAGER) public AppUser client;
    @ManyToOne(optional = false, fetch = FetchType.EAGER) public Vehicle vehicle;
    @Column(nullable = false) public LocalDate startDate;
    @Column(nullable = false) public LocalDate endDate;
    @Column(nullable = false, precision = 14, scale = 2) public BigDecimal totalAmount;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) public OrderStatus status = OrderStatus.PENDING;
    @Column(length = 2000) public String notes;
    @Column(length = 2000) public String reviewNotes;
    @ManyToOne(fetch = FetchType.EAGER) public AppUser reviewedBy;
    @Column(nullable = false) public Instant createdAt = Instant.now();
    @Version public long version;
}
