package br.com.rota.dto;

import br.com.rota.model.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;

public final class ApiDtos {
    private ApiDtos() {}
    public record UserView(UUID id, String username, String name, Role role) {}
    public record LoginInput(@NotBlank String username, @NotBlank String password) {}
    public record EmploymentInput(@NotBlank @Size(max = 150) String employer,
            @NotNull @DecimalMin("0.01") @Digits(integer = 12, fraction = 2) BigDecimal income) {}
    public record RegistrationInput(
            @NotBlank @Pattern(regexp = "[a-zA-Z0-9._@-]{3,80}", message = "Use de 3 a 80 letras, números, ponto, @, _ ou hífen.") String username,
            @NotBlank @Size(min = 8, max = 72) String password,
            @NotBlank @Size(max = 150) String name, @NotNull Role role,
            String agentCode, String rg, String cpf, String address, String profession,
            @Size(max = 3) List<@Valid EmploymentInput> employments) {}
    public record ProfileInput(@NotBlank @Size(max = 150) String name,
            @NotBlank @Size(max = 30) String rg, @NotBlank String cpf,
            @NotBlank @Size(max = 500) String address, @NotBlank @Size(max = 120) String profession,
            @NotNull @Size(max = 3) List<@Valid EmploymentInput> employments) {}
    public record ClientView(UUID id, String username, String name, String rg, String cpf,
            String address, String profession, List<EmploymentInput> employments) {}
    public record BankView(UUID id, String name) {}
    public record VehicleInput(@NotBlank @Size(max = 60) String registration,
            @Min(1900) @Max(2100) int year,
            @NotBlank @Size(max = 80) String brand, @NotBlank @Size(max = 100) String model,
            @NotBlank @Size(max = 8) String plate,
            @NotNull @DecimalMin("0.01") @Digits(integer = 12, fraction = 2) BigDecimal dailyRate,
            @NotBlank @Size(max = 60) String category) {}
    public record VehicleView(UUID id, String registration, int year, String brand, String model,
            String plate, BigDecimal dailyRate, String category, Role ownerType, UUID ownerId, String ownerName) {}
    public record OrderInput(@NotNull UUID vehicleId, @NotNull LocalDate startDate,
            @NotNull LocalDate endDate, @Size(max = 2000) String notes) {}
    public record ReviewInput(@NotNull Boolean approved, @NotBlank @Size(max = 2000) String reviewNotes) {}
    public record CreditInput(@NotNull UUID bankId,
            @NotNull @DecimalMin("0.01") @Digits(integer = 12, fraction = 2) BigDecimal amount,
            @NotNull @DecimalMin("0") @Digits(integer = 4, fraction = 4) BigDecimal interestRate,
            @NotNull @Min(1) @Max(600) Integer installments) {}
    public record ContractInput(@NotNull Role ownerType, @Valid CreditInput credit) {}
    public record OrderView(UUID id, UUID clientId, String clientName, UUID vehicleId, VehicleView vehicle,
            LocalDate startDate, LocalDate endDate, BigDecimal totalAmount, OrderStatus status,
            String notes, String reviewNotes, String reviewedByName, Instant createdAt) {}
    public record CreditView(UUID bankId, String bankName, BigDecimal amount, BigDecimal interestRate, Integer installments) {}
    public record ContractView(UUID id, UUID orderId, String clientName, VehicleView vehicle,
            LocalDate startDate, LocalDate endDate, BigDecimal totalAmount,
            Role ownerType, String ownerName, Instant signedAt, CreditView credit) {}
}
