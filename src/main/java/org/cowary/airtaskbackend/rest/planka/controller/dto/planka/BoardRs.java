package org.cowary.airtaskbackend.rest.planka.controller.dto.planka;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Data;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class BoardRs {
    Long id;
    String name;
    Long projectId;
    List<TaskListRs> taskList;
}
