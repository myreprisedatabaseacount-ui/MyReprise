package com.myreprise.payment.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Contrôleur de santé pour le service de paiement
 */
@RestController
@RequestMapping("/payment")
public class PaymentController {

    /**
     * Route de santé unique
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        System.out.println("✅ Service Spring Boot Payment - Démarré et en bonne santé");
        
        Map<String, Object> response = Map.of(
            "status", "healthy",
            "service", "MyReprise-Payment",
            "message", "Service démarré et en bonne santé",
            "timestamp", LocalDateTime.now().toString(),
            "version", "1.0.0"
        );
        
        return ResponseEntity.ok(response);
    }
}
