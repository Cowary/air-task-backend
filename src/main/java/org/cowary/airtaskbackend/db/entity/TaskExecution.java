package org.cowary.airtaskbackend.db.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.*;

@Table(name = "task_execution")
@Entity
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class TaskExecution extends BaseEntity {
    @Column(nullable = false)
    String taskName;
    @Column(nullable = false)
    Long duration;
    @Column(nullable = false)
    Long plankaTaskId;
}
