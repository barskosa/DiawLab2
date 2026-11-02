package br.com.rota.repository;

import br.com.rota.model.*;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;

public interface UserRepository extends JpaRepository<AppUser, UUID> {
    Optional<AppUser> findByUsername(String username);
    boolean existsByUsername(String username);
    boolean existsByCpfAndIdNot(String cpf, UUID id);
    List<AppUser> findByRoleAndActiveTrueOrderByNameAsc(Role role);
}
