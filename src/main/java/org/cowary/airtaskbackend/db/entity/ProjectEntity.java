package org.cowary.airtaskbackend.db.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Table(name = "project")
@Entity
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class ProjectEntity extends BaseEntity{
    @Column(nullable = false)
    String name;
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    Status status;
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    Priority priority;
    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    List<WeeklyEntity> weeklyEntityList;
}
