package br.com.rota.controller;

import br.com.rota.dto.ApiDtos.*;
import br.com.rota.service.RentalService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController @RequestMapping("/api/orders")
public class OrderController {
    private final RentalService rentals;
    public OrderController(RentalService rentals) { this.rentals = rentals; }
    @GetMapping public List<OrderView> list() { return rentals.orders(); }
    @GetMapping("/{id}") public OrderView get(@PathVariable UUID id) { return rentals.order(id); }
    @PostMapping @ResponseStatus(HttpStatus.CREATED) public OrderView create(@Valid @RequestBody OrderInput input) { return rentals.createOrder(input); }
    @PutMapping("/{id}") public OrderView update(@PathVariable UUID id,@Valid @RequestBody OrderInput input) { return rentals.updateOrder(id,input); }
    @PostMapping("/{id}/cancel") public OrderView cancel(@PathVariable UUID id) { return rentals.cancelOrder(id); }
    @PostMapping("/{id}/review") public OrderView review(@PathVariable UUID id,@Valid @RequestBody ReviewInput input) { return rentals.reviewOrder(id,input); }
    @PostMapping("/{id}/contract") @ResponseStatus(HttpStatus.CREATED) public ContractView contract(@PathVariable UUID id,@Valid @RequestBody ContractInput input) { return rentals.createContract(id,input); }
}
