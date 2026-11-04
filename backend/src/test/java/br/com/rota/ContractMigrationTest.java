package br.com.rota;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.datasource.SingleConnectionDataSource;
import java.sql.*;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;

class ContractMigrationTest {
    @Test void v2BackfillsExistingContractsAndRejectsPartiallyNullCredit() throws Exception {
        String url = "jdbc:h2:mem:migration_"+UUID.randomUUID()+";MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1";
        // Mantém a conexão que compilou os CHECKs aberta durante o teste de upgrade.
        // O pool da aplicação já faz isso; aqui o Flyway usa JDBC sem pool.
        try (Connection physicalConnection=DriverManager.getConnection(url,"sa","")) {
            var dataSource = new SingleConnectionDataSource(physicalConnection,true);
            Flyway.configure().dataSource(dataSource).schemas("rental").defaultSchema("rental").target("1").load().migrate();
            UUID client=UUID.randomUUID(),bank=UUID.randomUUID(),vehicle=UUID.randomUUID(),order=UUID.randomUUID(),contract=UUID.randomUUID();
            UUID oneDayOrder=UUID.randomUUID(),oneDayContract=UUID.randomUUID();
            try (Connection connection=DriverManager.getConnection(url,"sa",""); Statement sql=connection.createStatement()) {
                connection.setSchema("rental");
                sql.executeUpdate("INSERT INTO app_users(id,username,password_hash,name,role) VALUES ('"+client+"','client','hash','Cliente original','CLIENT'),('"+bank+"','bank','hash','Banco original','BANK')");
                sql.executeUpdate("INSERT INTO vehicles(id,registration,manufacture_year,brand,model,plate,daily_rate,category,owner_id) VALUES ('"+vehicle+"','TESTE',2025,'Honda','City','MIG1A23',999.00,'Sedan','"+bank+"')");
                sql.executeUpdate("INSERT INTO rental_orders(id,client_id,vehicle_id,start_date,end_date,total_amount,status,created_at) VALUES ('"+order+"','"+client+"','"+vehicle+"',DATE '2026-01-01',DATE '2026-01-04',600.00,'CONTRACTED',CURRENT_TIMESTAMP),('"+oneDayOrder+"','"+client+"','"+vehicle+"',DATE '2026-02-01',DATE '2026-02-01',50.00,'CONTRACTED',CURRENT_TIMESTAMP)");
                sql.executeUpdate("INSERT INTO rental_contracts(id,order_id,owner_id,signed_at,bank_id,credit_amount,interest_rate,installments) VALUES ('"+contract+"','"+order+"','"+client+"',CURRENT_TIMESTAMP,'"+bank+"',500.00,1.50,5)");
                sql.executeUpdate("INSERT INTO rental_contracts(id,order_id,owner_id,signed_at) VALUES ('"+oneDayContract+"','"+oneDayOrder+"','"+client+"',CURRENT_TIMESTAMP)");
            }
            Flyway.configure().dataSource(dataSource).schemas("rental").defaultSchema("rental").load().migrate();
            try (Connection connection=DriverManager.getConnection(url,"sa",""); Statement sql=connection.createStatement()) {
                connection.setSchema("rental");
                try (ResultSet row=sql.executeQuery("SELECT * FROM rental_contracts WHERE id='"+contract+"'")) {
                    assertTrue(row.next()); assertEquals("City",row.getString("snapshot_vehicle_model"));
                    assertEquals("Cliente original",row.getString("snapshot_client_name")); assertEquals("Cliente original",row.getString("snapshot_owner_name"));
                    assertEquals("Banco original",row.getString("snapshot_bank_name"));
                    assertEquals("200.00",row.getBigDecimal("snapshot_vehicle_daily_rate").toPlainString());
                }
                try (ResultSet row=sql.executeQuery("SELECT * FROM rental_contracts WHERE id='"+oneDayContract+"'")) {
                    assertTrue(row.next()); assertEquals("50.00",row.getBigDecimal("snapshot_vehicle_daily_rate").toPlainString());
                    assertNull(row.getString("snapshot_bank_name"));
                }
                assertThrows(SQLException.class,() -> sql.executeUpdate("UPDATE rental_contracts SET credit_amount=NULL WHERE id='"+contract+"'"));
                assertThrows(SQLException.class,() -> sql.executeUpdate("UPDATE rental_contracts SET interest_rate=NULL WHERE id='"+contract+"'"));
                assertThrows(SQLException.class,() -> sql.executeUpdate("UPDATE rental_contracts SET installments=601 WHERE id='"+contract+"'"));
            }
        }
    }
}
