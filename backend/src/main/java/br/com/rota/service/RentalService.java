package br.com.rota.service;

import br.com.rota.dto.ApiDtos.*;
import br.com.rota.exception.ApiException;
import br.com.rota.model.*;
import br.com.rota.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.*;
import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service @Transactional
public class RentalService {
    private final AuthService auth;
    private final VehicleRepository vehicles;
    private final OrderRepository orders;
    private final ContractRepository contracts;
    public RentalService(AuthService auth, VehicleRepository vehicles,
            OrderRepository orders, ContractRepository contracts) {
        this.auth = auth; this.vehicles = vehicles; this.orders = orders; this.contracts = contracts;
    }
    public List<VehicleView> vehicles() { auth.current(); return vehicles.findAllByOrderByBrandAscModelAsc().stream().map(RentalService::vehicleView).toList(); }
    public VehicleView createVehicle(VehicleInput input) {
        var agent = auth.current(); AuthService.requireAgent(agent);
        var vehicle = new Vehicle(); vehicle.owner = agent; applyVehicle(vehicle,input);
        return vehicleView(vehicles.saveAndFlush(vehicle));
    }
    public VehicleView updateVehicle(UUID id, VehicleInput input) {
        AuthService.requireAgent(auth.current()); var vehicle = lockedVehicle(id); applyVehicle(vehicle,input);
        return vehicleView(vehicles.saveAndFlush(vehicle));
    }
    public void deleteVehicle(UUID id) {
        AuthService.requireAgent(auth.current()); var vehicle = lockedVehicle(id);
        if (orders.existsByVehicleId(id)) throw ApiException.conflict("O automóvel possui histórico de pedidos e não pode ser excluído.");
        vehicles.delete(vehicle); vehicles.flush();
    }
    private void applyVehicle(Vehicle vehicle, VehicleInput input) {
        String plate = input.plate().replace("-", "").toUpperCase(Locale.ROOT).trim();
        if (!plate.matches("[A-Z]{3}[0-9][A-Z0-9][0-9]{2}")) throw ApiException.badRequest("Informe uma placa válida no formato ABC1234 ou ABC1D23.");
        UUID id = vehicle.id == null ? new UUID(0,0) : vehicle.id;
        String registration = text(input.registration(),60,"Matrícula",true).toUpperCase(Locale.ROOT);
        if (registration.length() > 60) throw ApiException.badRequest("A matrícula deve conter até 60 caracteres após a normalização.");
        if (vehicles.existsByRegistrationAndIdNot(registration,id)) throw ApiException.conflict("A matrícula já está cadastrada.");
        if (vehicles.existsByPlateAndIdNot(plate,id)) throw ApiException.conflict("A placa já está cadastrada.");
        if (input.year() > RentalDates.today().getYear() + 1) throw ApiException.badRequest("O ano do automóvel não pode ultrapassar o próximo ano.");
        vehicle.registration = registration; vehicle.year = input.year(); vehicle.brand = text(input.brand(),80,"Marca",true);
        vehicle.model = text(input.model(),100,"Modelo",true); vehicle.plate = plate; vehicle.dailyRate = input.dailyRate().setScale(2,RoundingMode.UNNECESSARY);
        vehicle.category = text(input.category(),60,"Categoria",true);
    }
    public List<OrderView> orders() {
        var user = auth.current();
        return (user.role == Role.CLIENT ? orders.findByClientIdOrderByCreatedAtDesc(user.id) : orders.findAllByOrderByCreatedAtDesc()).stream().map(RentalService::orderView).toList();
    }
    public OrderView order(UUID id) { var user = auth.current(); var order = findOrder(id); allowOrder(user,order); return orderView(order); }
    public OrderView createOrder(OrderInput input) {
        var client = auth.currentForUpdate(); AuthService.requireClient(client);
        var order = new RentalOrder(); order.client = client; applyOrder(order,input);
        return orderView(orders.saveAndFlush(order));
    }
    public OrderView updateOrder(UUID id, OrderInput input) {
        var user = auth.current(); var order = lockedOrder(id); allowOrder(user,order); requireEditable(order);
        applyOrder(order,input); order.status = OrderStatus.PENDING; order.reviewedBy = null; order.reviewNotes = null;
        return orderView(orders.saveAndFlush(order));
    }
    public OrderView cancelOrder(UUID id) {
        var user = auth.current(); AuthService.requireClient(user); var order = lockedOrder(id); allowOrder(user,order); requireEditable(order);
        order.status = OrderStatus.CANCELLED; return orderView(orders.saveAndFlush(order));
    }
    public OrderView reviewOrder(UUID id, ReviewInput input) {
        var agent = auth.current(); AuthService.requireAgent(agent); var order = lockedOrder(id);
        if (order.status != OrderStatus.PENDING) throw ApiException.conflict("Somente pedidos em análise podem receber parecer.");
        order.status = input.approved() ? OrderStatus.APPROVED : OrderStatus.REJECTED;
        order.reviewNotes = text(input.reviewNotes(),2000,"Parecer financeiro",true); order.reviewedBy = agent;
        return orderView(orders.saveAndFlush(order));
    }
    private void applyOrder(RentalOrder order, OrderInput input) {
        RentalDates.validate(input.startDate(),input.endDate());
        var vehicle = lockedVehicle(input.vehicleId());
        ensureAvailable(vehicle.id,input.startDate(),input.endDate());
        BigDecimal amount = vehicle.dailyRate.multiply(BigDecimal.valueOf(Math.max(1,ChronoUnit.DAYS.between(input.startDate(),input.endDate())))).setScale(2);
        if (amount.compareTo(new BigDecimal("999999999999.99")) > 0) throw ApiException.badRequest("O valor do período ultrapassa o limite permitido.");
        order.vehicle = vehicle; order.startDate = input.startDate(); order.endDate = input.endDate();
        order.notes = text(input.notes(),2000,"Observações",false); order.totalAmount = amount;
    }
    public ContractView createContract(UUID id, ContractInput input) {
        var agent = auth.current(); AuthService.requireAgent(agent); var order = lockedOrder(id);
        if (order.status != OrderStatus.APPROVED) throw ApiException.conflict("O pedido precisa de parecer financeiro positivo antes da contratação.");
        RentalDates.validate(order.startDate,order.endDate);
        var vehicle = lockedVehicle(order.vehicle.id);
        ensureAvailable(vehicle.id,order.startDate,order.endDate);
        var contract = new RentalContract(); contract.order = order;
        if (input.credit() != null) {
            var credit = input.credit();
            if (agent.role != Role.BANK || !agent.id.equals(credit.bankId()))
                throw new ApiException(org.springframework.http.HttpStatus.FORBIDDEN, "Somente o próprio banco agente pode conceder o crédito.");
            if (credit.amount().compareTo(order.totalAmount) > 0) throw ApiException.badRequest("O crédito não pode ultrapassar o valor do aluguel.");
            contract.bank = agent; contract.creditAmount = credit.amount(); contract.interestRate = credit.interestRate(); contract.installments = credit.installments();
        }
        contract.owner = switch (input.ownerType()) {
            case CLIENT -> order.client;
            case COMPANY -> { if (agent.role != Role.COMPANY) throw ApiException.badRequest("A propriedade da empresa exige contratação por um agente empresa."); yield agent; }
            case BANK -> {
                if (agent.role == Role.BANK) yield agent;
                if (contract.bank != null) yield contract.bank;
                throw ApiException.badRequest("A propriedade do banco exige um banco agente na contratação.");
            }
        };
        vehicle.owner = contract.owner; vehicles.save(vehicle);
        contract.snapshotVehicleRegistration = vehicle.registration; contract.snapshotVehicleYear = vehicle.year;
        contract.snapshotVehicleBrand = vehicle.brand; contract.snapshotVehicleModel = vehicle.model;
        contract.snapshotVehiclePlate = vehicle.plate; contract.snapshotVehicleCategory = vehicle.category;
        // A tarifa negociada é a usada no pedido, mesmo que a diária da frota tenha sido editada.
        contract.snapshotVehicleDailyRate = order.totalAmount.divide(BigDecimal.valueOf(Math.max(1,ChronoUnit.DAYS.between(order.startDate,order.endDate))),2,RoundingMode.UNNECESSARY);
        contract.snapshotClientName = order.client.name; contract.snapshotOwnerName = contract.owner.name;
        contract.snapshotBankName = contract.bank == null ? null : contract.bank.name;
        order.status = OrderStatus.CONTRACTED; orders.save(order);
        return contractView(contracts.saveAndFlush(contract));
    }
    public List<ContractView> contracts() {
        var user = auth.current();
        return (user.role == Role.CLIENT ? contracts.findByOrderClientIdOrderBySignedAtDesc(user.id) : contracts.findAllByOrderBySignedAtDesc()).stream().map(RentalService::contractView).toList();
    }
    private void ensureAvailable(UUID vehicleId, LocalDate start, LocalDate end) {
        LocalDate effectiveEnd = RentalDates.endExclusive(start,end);
        for (var booked : orders.findByVehicleIdAndStatus(vehicleId,OrderStatus.CONTRACTED)) {
            LocalDate bookedEnd = RentalDates.endExclusive(booked.startDate,booked.endDate);
            if (start.isBefore(bookedEnd) && booked.startDate.isBefore(effectiveEnd))
                throw ApiException.conflict("O automóvel já possui contrato no período escolhido. Selecione outras datas.");
        }
    }
    private RentalOrder findOrder(UUID id) { return orders.findById(id).orElseThrow(() -> ApiException.notFound("Pedido")); }
    private RentalOrder lockedOrder(UUID id) { return orders.findLocked(id).orElseThrow(() -> ApiException.notFound("Pedido")); }
    private Vehicle lockedVehicle(UUID id) { return vehicles.findLocked(id).orElseThrow(() -> ApiException.notFound("Automóvel")); }
    private static void allowOrder(AppUser user, RentalOrder order) { if (user.role == Role.CLIENT && !user.id.equals(order.client.id)) throw ApiException.forbidden(); }
    private static void requireEditable(RentalOrder order) {
        if (order.status != OrderStatus.PENDING && order.status != OrderStatus.APPROVED) throw ApiException.conflict("Somente pedidos em análise ou aprovados podem ser alterados ou cancelados.");
    }
    private static String text(String value, int max, String label, boolean required) {
        if (value == null) {
            if (required) throw ApiException.badRequest(label + " é obrigatório.");
            return "";
        }
        if ((required && value.isBlank()) || value.length() > max || value.indexOf('\0') >= 0)
            throw ApiException.badRequest(label + " deve conter até " + max + " caracteres válidos.");
        return value.strip();
    }
    public static VehicleView vehicleView(Vehicle v) { return new VehicleView(v.id,v.registration,v.year,v.brand,v.model,v.plate,v.dailyRate,v.category,v.owner.role,v.owner.id,v.owner.name); }
    public static OrderView orderView(RentalOrder o) { return new OrderView(o.id,o.client.id,o.client.name,o.vehicle.id,vehicleView(o.vehicle),o.startDate,o.endDate,o.totalAmount,o.status,o.notes,o.reviewNotes,o.reviewedBy == null ? null : o.reviewedBy.name,o.createdAt); }
    public static ContractView contractView(RentalContract c) {
        var o = c.order;
        var credit = c.bank == null ? null : new CreditView(c.bank.id,c.snapshotBankName,c.creditAmount,c.interestRate,c.installments);
        var vehicle = new VehicleView(o.vehicle.id,c.snapshotVehicleRegistration,c.snapshotVehicleYear,c.snapshotVehicleBrand,
                c.snapshotVehicleModel,c.snapshotVehiclePlate,c.snapshotVehicleDailyRate,c.snapshotVehicleCategory,
                c.owner.role,c.owner.id,c.snapshotOwnerName);
        return new ContractView(c.id,o.id,c.snapshotClientName,vehicle,o.startDate,o.endDate,o.totalAmount,c.owner.role,c.snapshotOwnerName,c.signedAt,credit);
    }
}
