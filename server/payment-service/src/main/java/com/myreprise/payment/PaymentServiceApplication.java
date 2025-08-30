package com.myreprise.payment;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.transaction.annotation.EnableTransactionManagement;

/**
 * Application principale du service de paiement MyReprise
 * 
 * Ce service gère tous les aspects des paiements en ligne :
 * - Intégration Stripe et PayPal
 * - Gestion des transactions
 * - Webhooks de paiement
 * - Rapports et analytics de paiement
 * 
 * @author MyReprise Team
 * @version 1.0.0
 */
@SpringBootApplication
@EnableJpaAuditing
@EnableAsync
@EnableScheduling
@EnableTransactionManagement
public class PaymentServiceApplication {

    public static void main(String[] args) {
        // Configuration du profil Spring actif si non défini
        if (System.getProperty("spring.profiles.active") == null) {
            System.setProperty("spring.profiles.active", "dev");
        }
        
        SpringApplication.run(PaymentServiceApplication.class, args);
    }
}
