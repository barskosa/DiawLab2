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
    // Termos copiados na assinatura: alterações posteriores no cadastro não reescrevem o contrato.
    @Column(nullable = false, length = 60) public String snapshotVehicleRegistration;
    @Column(nullable = false) public int snapshotVehicleYear;
    @Column(nullable = false, length = 80) public String snapshotVehicleBrand;
    @Column(nullable = false, length = 100) public String snapshotVehicleModel;
    @Column(nullable = false, length = 8) public String snapshotVehiclePlate;
    @Column(nullable = false, precision = 14, scale = 2) public BigDecimal snapshotVehicleDailyRate;
    @Column(nullable = false, length = 60) public String snapshotVehicleCategory;
    @Column(nullable = false, length = 150) public String snapshotClientName;
    @Column(nullable = false, length = 150) public String snapshotOwnerName;
    @Column(length = 150) public String snapshotBankName;
}
