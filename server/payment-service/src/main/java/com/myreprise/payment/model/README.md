# 📁 Modèles JPA/Hibernate

Ce dossier contient toutes les entités JPA pour le service de paiement Spring Boot.

## 📋 Structure recommandée

### Exemple d'entité Payment.java :

```java
package com.myreprise.payment.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.GenericGenerator;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "payments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(callSuper = false)
public class Payment {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(name = "id", columnDefinition = "VARCHAR(36)")
    private UUID id;

    @Column(name = "external_id", nullable = false, unique = true)
    private String externalId;

    @Column(name = "user_id", nullable = false, columnDefinition = "VARCHAR(36)")
    private UUID userId;

    @Column(name = "order_id", columnDefinition = "VARCHAR(36)")
    private UUID orderId;

    @Column(name = "amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(name = "currency", nullable = false, length = 3)
    private String currency = "EUR";

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false)
    private PaymentMethod paymentMethod;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private PaymentStatus status = PaymentStatus.PENDING;

    @Column(name = "metadata", columnDefinition = "JSON")
    private String metadata;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "failed_at")
    private LocalDateTime failedAt;

    @Column(name = "failure_reason", columnDefinition = "TEXT")
    private String failureReason;

    // Relations
    @OneToMany(mappedBy = "payment", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Refund> refunds;

    @OneToMany(mappedBy = "payment", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<PaymentEvent> events;

    // Méthodes utilitaires
    public boolean isCompleted() {
        return PaymentStatus.COMPLETED.equals(this.status);
    }

    public boolean canBeRefunded() {
        return PaymentStatus.COMPLETED.equals(this.status);
    }
}
```

### Énumérations :

```java
public enum PaymentMethod {
    STRIPE("stripe"),
    PAYPAL("paypal"),
    BANK_TRANSFER("bank_transfer");

    private final String value;

    PaymentMethod(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}

public enum PaymentStatus {
    PENDING("pending"),
    PROCESSING("processing"),
    COMPLETED("completed"),
    FAILED("failed"),
    CANCELLED("cancelled"),
    REFUNDED("refunded");

    private final String value;

    PaymentStatus(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}
```

## 🔗 Associations JPA

### One-to-Many
```java
@OneToMany(mappedBy = "payment", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
private List<Refund> refunds;
```

### Many-to-One
```java
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "payment_id", nullable = false)
private Payment payment;
```

### Many-to-Many
```java
@ManyToMany
@JoinTable(
    name = "payment_tags",
    joinColumns = @JoinColumn(name = "payment_id"),
    inverseJoinColumns = @JoinColumn(name = "tag_id")
)
private Set<Tag> tags;
```

## 📚 Annotations importantes

### Entité de base
- `@Entity` - Marque la classe comme entité JPA
- `@Table(name = "table_name")` - Nom de la table
- `@Id` - Clé primaire
- `@GeneratedValue` - Génération automatique d'ID

### Colonnes
- `@Column(name = "column_name")` - Nom de colonne
- `@Column(nullable = false)` - Contrainte NOT NULL
- `@Column(unique = true)` - Contrainte UNIQUE
- `@Column(length = 255)` - Longueur pour VARCHAR
- `@Column(precision = 10, scale = 2)` - Pour DECIMAL

### Types spéciaux
- `@Enumerated(EnumType.STRING)` - Enum stocké comme string
- `@CreationTimestamp` - Timestamp de création automatique
- `@UpdateTimestamp` - Timestamp de mise à jour automatique
- `@Lob` - Large Object (TEXT, BLOB)

### Validation
- `@NotNull` - Validation not null
- `@NotBlank` - String non vide
- `@Email` - Format email
- `@Min(0)` - Valeur minimale
- `@DecimalMin("0.0")` - Décimal minimum

## 🏗️ Auditabilité

Pour activer l'audit automatique, créez une classe de base :

```java
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
@Data
public abstract class Auditable {

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @CreatedBy
    @Column(name = "created_by", updatable = false)
    private String createdBy;

    @LastModifiedBy
    @Column(name = "updated_by")
    private String updatedBy;
}
```

Puis étendre vos entités :

```java
@Entity
@Table(name = "payments")
public class Payment extends Auditable {
    // ... autres champs
}
```

## 🚀 Configuration recommandée

Dans application.yml, modes ddl-auto :

- `create` - Supprime et recrée les tables
- `create-drop` - Comme create + supprime à la fermeture
- `update` - Met à jour le schéma existant
- `validate` - Valide le schéma (recommandé en production)
- `none` - Aucune action

## 📊 Optimisations

### Index
```java
@Table(name = "payments", indexes = {
    @Index(name = "idx_payment_user", columnList = "user_id"),
    @Index(name = "idx_payment_status", columnList = "status"),
    @Index(name = "idx_payment_created", columnList = "created_at")
})
```

### Fetch strategies
- `FetchType.LAZY` - Chargement paresseux (recommandé)
- `FetchType.EAGER` - Chargement immédiat (attention aux N+1)

### Batch processing
```java
@BatchSize(size = 10)
@OneToMany(mappedBy = "payment")
private List<Refund> refunds;
```
