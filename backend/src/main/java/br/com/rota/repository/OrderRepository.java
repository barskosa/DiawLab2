package br.com.rota.repository;

import br.com.rota.model.*;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.util.*;

public interface OrderRepository extends JpaRepository<RentalOrder, UUID> {
    List<RentalOrder> findAllByOrderByCreatedAtDesc();
    List<RentalOrder> findByClientIdOrderByCreatedAtDesc(UUID id);
    boolean existsByVehicleId(UUID id);
    boolean existsByClientIdAndStatusIn(UUID id, Collection<OrderStatus> statuses);
    List<RentalOrder> findByVehicleIdAndStatus(UUID id, OrderStatus status);
    @Lock(LockModeType.PESSIMISTIC_WRITE) @Query("select o from RentalOrder o where o.id = :id")
    Optional<RentalOrder> findLocked(@Param("id") UUID id);
}
