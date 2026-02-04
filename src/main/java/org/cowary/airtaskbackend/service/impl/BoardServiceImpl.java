package org.cowary.airtaskbackend.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.cowary.airtaskbackend.api.planko.BoardsApi;
import org.cowary.airtaskbackend.model.planko.GetBoard200ResponseIncludedCardsInner;
import org.cowary.airtaskbackend.model.planko.ModelList;
import org.cowary.airtaskbackend.rest.planka.controller.dto.planka.BoardRs;
import org.cowary.airtaskbackend.rest.planka.controller.dto.planka.PlankaTaskDtoRs;
import org.cowary.airtaskbackend.rest.planka.controller.dto.planka.TaskListRs;
import org.cowary.airtaskbackend.service.BoardService;
import org.cowary.airtaskbackend.service.ProjectService;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class BoardServiceImpl implements BoardService {
    private final ProjectService projectService;
    private final BoardsApi boardsApi;

    @Override
    public List<BoardRs> getAllBoardByProject(Long projectId) {
        var project = projectService.getAllProjects().getProjectList().stream().filter(pr -> projectId.equals(pr.getId())).findFirst();

        List<BoardRs> boards = new ArrayList<>();
        for (BoardRs boardRs : project.get().getBoardList()) {
            var boardPlanka = boardsApi.getBoard(String.valueOf(boardRs.getId()), false);
            boards.add(BoardRs.builder()
                    .id(Long.valueOf(boardPlanka.getItem().getId()))
                    .name(boardPlanka.getItem().getName())
                    .projectId(projectId)
                    .taskList(getTaskList(Long.valueOf(boardPlanka.getItem().getId()), boardPlanka.getIncluded().getLists(), boardPlanka.getIncluded().getCards())).build());
        }
        return boards;
    }

    public List<TaskListRs> getTaskList(Long boardId, List<ModelList> taskList, List<GetBoard200ResponseIncludedCardsInner> cardList) {
        log.info("boardId: {}, getTaskList: {}, cardList: {}", boardId, taskList, cardList);
        List<TaskListRs> taskLists = new ArrayList<>();
        for (ModelList taskListPlanko : taskList.stream().filter(m -> ModelList.TypeEnum.ACTIVE.equals(m.getType())).toList()) {
            taskLists.add(TaskListRs.builder()
                    .id(Long.valueOf(taskListPlanko.getId()))
                    .name(taskListPlanko.getName())
                    .boardId(boardId)
                    .tasks(cardList.stream()
                            .filter(c -> c.getListId().equals(taskListPlanko.getId()))
                            .filter(c -> !c.getIsClosed())
                            .map(t -> PlankaTaskDtoRs.builder()
                                    .id(Long.valueOf(t.getId()))
                                    .name(t.getName())
                                    .taskListId(Long.valueOf(taskListPlanko.getId()))
                                    .build())
                            .toList()
                    ).build());
        }
        log.info("boardId: {}, getTaskList: {}", boardId, taskLists);
        return taskLists;
    }


}
