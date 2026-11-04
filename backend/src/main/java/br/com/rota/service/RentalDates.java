package br.com.rota.service;

import br.com.rota.exception.ApiException;
import java.time.*;

/** Convenção única de datas do aluguel: intervalo [retirada, devolução), mínimo de um dia. */
final class RentalDates {
    private static final ZoneId BUSINESS_ZONE = ZoneId.of("America/Sao_Paulo");
    private static final LocalDate MAX_DATE = LocalDate.of(9999,12,31);
    private RentalDates() {}
    static LocalDate today() { return LocalDate.now(BUSINESS_ZONE); }
    static LocalDate endExclusive(LocalDate start, LocalDate end) { return end.equals(start) ? end.plusDays(1) : end; }
    static void validate(LocalDate start, LocalDate end) {
        if (start == null || end == null || start.isBefore(today()) || end.isBefore(start))
            throw ApiException.badRequest("A retirada deve ser a partir de hoje e a devolução não pode ser anterior à retirada.");
        if (start.isAfter(MAX_DATE) || end.isAfter(MAX_DATE))
            throw ApiException.badRequest("As datas devem conter um ano de quatro dígitos, até 9999.");
    }
}
