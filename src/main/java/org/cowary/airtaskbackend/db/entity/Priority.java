package org.cowary.airtaskbackend.db.entity;

import lombok.AllArgsConstructor;
import lombok.Getter;

@AllArgsConstructor
@Getter
public enum Priority {
    HIGH(2), MIDDLE(1), LOW(0);

    final Integer priority;
}
