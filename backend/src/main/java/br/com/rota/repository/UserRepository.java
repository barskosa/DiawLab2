package br.com.rota.repository;

import br.com.rota.model.*;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.util.*;

public interface UserRepository extends JpaRepository<AppUser, UUID> {
    @Lock(LockModeType.PESSIMISTIC_WRITE) @Query("select u from AppUser u where u.id = :id")
    Optional<AppUser> findLocked(@Param("id") UUID id);
    Optional<AppUser> findByUsername(String username);
    boolean existsByUsername(String username);
    boolean existsByCpfAndIdNot(String cpf, UUID id);
    List<AppUser> findByRoleAndActiveTrueOrderByNameAsc(Role role);
}
