package org.cowary.airtaskbackend.db.entity;

import jakarta.persistence.*;
import lombok.*;

@Table(name = "weekly")
@Entity
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class WeeklyEntity extends BaseEntity {
    @Column(nullable = false)
    String name;
    @Column(nullable = false)
    Integer count;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    ProjectEntity project;
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    Priority priority;
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    Status status;
}
