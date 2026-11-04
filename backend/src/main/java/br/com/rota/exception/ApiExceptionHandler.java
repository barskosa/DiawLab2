package br.com.rota.exception;

import org.slf4j.*;
import org.springframework.dao.*;
import org.springframework.http.*;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.servlet.resource.NoResourceFoundException;
import java.util.*;

@RestControllerAdvice
public class ApiExceptionHandler {
    private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);
    @ExceptionHandler(ApiException.class)
    ResponseEntity<?> business(ApiException e) { return ResponseEntity.status(e.status).body(Map.of("message", e.getMessage())); }
    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<?> validation(MethodArgumentNotValidException e) {
        Map<String,String> fields = new LinkedHashMap<>();
        e.getBindingResult().getFieldErrors().forEach(f -> fields.putIfAbsent(f.getField(), f.getDefaultMessage()));
        return ResponseEntity.badRequest().body(Map.of("message", "Confira os campos informados.", "fieldErrors", fields));
    }
    @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class})
    ResponseEntity<?> malformed(Exception e) { return ResponseEntity.badRequest().body(Map.of("message", "Dados inválidos. Confira datas, valores e identificadores.")); }
    @ExceptionHandler(NoResourceFoundException.class)
    ResponseEntity<?> missingResource(NoResourceFoundException e) { return ResponseEntity.status(404).body(Map.of("message", "Recurso não encontrado.")); }
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    ResponseEntity<?> wrongMethod(HttpRequestMethodNotSupportedException e) {
        var response = ResponseEntity.status(405);
        var methods = e.getSupportedHttpMethods();
        if (methods != null) response.allow(methods.toArray(HttpMethod[]::new));
        return response.body(Map.of("message", "Método HTTP não permitido para este recurso."));
    }
    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    ResponseEntity<?> wrongContentType(HttpMediaTypeNotSupportedException e) {
        return ResponseEntity.status(415).body(Map.of("message", "Envie os dados no formato JSON (Content-Type: application/json)."));
    }
    @ExceptionHandler({DataIntegrityViolationException.class, OptimisticLockingFailureException.class, PessimisticLockingFailureException.class})
    ResponseEntity<?> conflict(Exception e) { return ResponseEntity.status(409).body(Map.of("message", "O registro já existe, está em uso ou foi alterado. Atualize a página e tente novamente.")); }
    @ExceptionHandler(Exception.class)
    ResponseEntity<?> unexpected(Exception e) {
        log.error("Falha não prevista ao processar requisição", e);
        return ResponseEntity.internalServerError().body(Map.of("message", "Não foi possível concluir a operação. Tente novamente."));
    }
}
