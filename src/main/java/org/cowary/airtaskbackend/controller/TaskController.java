package org.cowary.airtaskbackend.controller;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.cowary.airtaskbackend.controller.dto.BoardRs;
import org.cowary.airtaskbackend.service.BoardService;
import org.cowary.airtaskbackend.service.CardService;
import org.cowary.airtaskbackend.service.TaskExecutionService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController("/task")
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true)
public class TaskController {
    BoardService boardService;
    CardService cardService;
    TaskExecutionService taskExecutionService;

    @GetMapping("/v1/list-by-project/{projectId}")
    public List<BoardRs> taskByProject(@PathVariable Long projectId) {
        return boardService.getAllBoardByProject(projectId);
    }

    @PostMapping("/v1/update-time")
    public Boolean updateTime(Long cardId, Long timeId) {
        var rs = cardService.updateTimerCard(cardId, timeId);
        taskExecutionService.create(rs.getItem().getName(), timeId, Long.valueOf(rs.getItem().getId()));
        return rs != null;
    }
}
