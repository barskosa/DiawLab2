package br.com.rota.controller;

import br.com.rota.dto.ApiDtos.ContractView;
import br.com.rota.service.RentalService;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @RequestMapping("/api/contracts")
public class ContractController {
    private final RentalService rentals;
    public ContractController(RentalService rentals) { this.rentals = rentals; }
    @GetMapping public List<ContractView> list() { return rentals.contracts(); }
}
