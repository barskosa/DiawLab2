package br.com.rota.model;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Embeddable
public class Employment {
    @Column(nullable = false, length = 150) public String employer;
    @Column(nullable = false, precision = 14, scale = 2) public BigDecimal income;
    public Employment() {}
    public Employment(String employer, BigDecimal income) { this.employer = employer; this.income = income; }
}
