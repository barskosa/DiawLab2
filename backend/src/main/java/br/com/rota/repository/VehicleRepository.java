package br.com.rota.repository;

import br.com.rota.model.Vehicle;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.util.*;

public interface VehicleRepository extends JpaRepository<Vehicle, UUID> {
    @Lock(LockModeType.PESSIMISTIC_WRITE) @Query("select v from Vehicle v where v.id = :id")
    Optional<Vehicle> findLocked(@Param("id") UUID id);
    List<Vehicle> findAllByOrderByBrandAscModelAsc();
    boolean existsByRegistrationAndIdNot(String registration, UUID id);
    boolean existsByPlateAndIdNot(String plate, UUID id);
}
