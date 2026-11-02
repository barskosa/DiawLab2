package br.com.rota.controller;

import br.com.rota.dto.ApiDtos.*;
import br.com.rota.service.*;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController @RequestMapping("/api")
public class VehicleController {
    private final RentalService rentals;
    private final AuthService auth;
    public VehicleController(RentalService rentals, AuthService auth) { this.rentals = rentals; this.auth = auth; }
    @GetMapping("/vehicles") public List<VehicleView> vehicles() { return rentals.vehicles(); }
    @PostMapping("/vehicles") @ResponseStatus(HttpStatus.CREATED) public VehicleView create(@Valid @RequestBody VehicleInput input) { return rentals.createVehicle(input); }
    @PutMapping("/vehicles/{id}") public VehicleView update(@PathVariable UUID id,@Valid @RequestBody VehicleInput input) { return rentals.updateVehicle(id,input); }
    @DeleteMapping("/vehicles/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) public void delete(@PathVariable UUID id) { rentals.deleteVehicle(id); }
    @GetMapping("/agents/banks") public List<BankView> banks() { return auth.banks(); }
}
