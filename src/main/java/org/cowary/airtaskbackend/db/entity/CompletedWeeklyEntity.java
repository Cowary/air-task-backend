package org.cowary.airtaskbackend.db.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Table(name = "completed_weekly")
@Entity
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class CompletedWeeklyEntity extends BaseEntity {
    @ManyToOne
    @JoinColumn(nullable = false, name = "weekly_id")
    WeeklyEntity weeklyEntity;
    @Column(nullable = false)
    LocalDateTime completedDate;
}
