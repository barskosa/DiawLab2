package br.com.rota.repository;

import br.com.rota.model.RentalContract;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;

public interface ContractRepository extends JpaRepository<RentalContract, UUID> {
    List<RentalContract> findAllByOrderBySignedAtDesc();
    List<RentalContract> findByOrderClientIdOrderBySignedAtDesc(UUID id);
}
