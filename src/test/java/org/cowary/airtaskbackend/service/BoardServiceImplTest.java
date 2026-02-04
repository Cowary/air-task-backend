package org.cowary.airtaskbackend.service;

import org.cowary.airtaskbackend.api.planko.BoardsApi;
import org.cowary.airtaskbackend.model.planko.*;
import org.cowary.airtaskbackend.rest.planka.controller.dto.planka.BoardRs;
import org.cowary.airtaskbackend.rest.planka.controller.dto.planka.PlankaProjectDtoRs;
import org.cowary.airtaskbackend.rest.planka.controller.dto.planka.ProjectListDtoRs;
import org.cowary.airtaskbackend.rest.planka.controller.dto.planka.TaskListRs;
import org.cowary.airtaskbackend.service.impl.BoardServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class BoardServiceImplTest {

    @Mock
    private ProjectService projectService;

    @Mock
    private BoardsApi boardsApi;

    @InjectMocks
    private BoardServiceImpl boardService;

    private List<ModelList> modelLists;
    private List<GetBoard200ResponseIncludedCardsInner> cardList;
    private GetBoard200Response getBoardResponse;

    @BeforeEach
    void setUp() {
        // Initialize test data
        modelLists = new ArrayList<>();
        ModelList list1 = new ModelList();
        list1.setId("1");
        list1.setName("To Do");
        list1.setType(ModelList.TypeEnum.ACTIVE);
        modelLists.add(list1);

        ModelList list2 = new ModelList();
        list2.setId("2");
        list2.setName("In Progress");
        list2.setType(ModelList.TypeEnum.ACTIVE);
        modelLists.add(list2);

        cardList = new ArrayList<>();
        GetBoard200ResponseIncludedCardsInner card1 = new GetBoard200ResponseIncludedCardsInner();
        card1.setId("101");
        card1.setName("Task 1");
        card1.setListId("1");
        card1.setIsClosed(false);
        cardList.add(card1);

        GetBoard200ResponseIncludedCardsInner card2 = new GetBoard200ResponseIncludedCardsInner();
        card2.setId("102");
        card2.setName("Task 2");
        card2.setListId("2");
        card2.setIsClosed(false);
        cardList.add(card2);

        GetBoard200ResponseItem item = new GetBoard200ResponseItem();
        item.setId("1001");
        item.setName("Test Board");

        GetBoard200ResponseIncluded included = new GetBoard200ResponseIncluded();
        included.setLists(modelLists);
        included.setCards(cardList);

        getBoardResponse = new GetBoard200Response();
        getBoardResponse.setItem(item);
        getBoardResponse.setIncluded(included);
    }

    /**
     * Test getAllBoardByProject method
     * Verifies that the method correctly retrieves all boards for a given project
     */
    @Test
    void getAllBoardByProject_ReturnsBoards_WhenProjectExists() {
        // Arrange
        Long projectId = 1L;
        BoardRs boardRs = BoardRs.builder()
            .id(1001L)
            .name("Test Board")
            .projectId(projectId)
            .build();
        
        PlankaProjectDtoRs project = PlankaProjectDtoRs.builder()
            .id(projectId)
            .name("Test Project")
            .boardList(List.of(boardRs))
            .build();
        
        ProjectListDtoRs projectListDtoRs = ProjectListDtoRs.builder()
            .projectList(List.of(project))
            .build();
        when(projectService.getAllProjects()).thenReturn(projectListDtoRs);
        
        when(boardsApi.getBoard(eq("1001"), any())).thenReturn(getBoardResponse);

        // Act
        List<BoardRs> result = boardService.getAllBoardByProject(projectId);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result).hasSize(1);
        BoardRs board = result.get(0);
        assertThat(board.getId()).isEqualTo(1001L);
        assertThat(board.getName()).isEqualTo("Test Board");
        assertThat(board.getProjectId()).isEqualTo(projectId);
        assertThat(board.getTaskList()).hasSize(2);
    }

    /**
     * Test getTaskList method
     * Verifies that the method correctly converts Planka model lists and cards to TaskListRs DTOs
     */
    @Test
    void getTaskList_ReturnsTaskListRs_WhenValidDataProvided() {
        // Arrange
        Long boardId = 1001L;

        // Act
        List<TaskListRs> result = boardService.getTaskList(boardId, modelLists, cardList);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result).hasSize(2);
        
        TaskListRs toDoList = result.get(0);
        assertThat(toDoList.getId()).isEqualTo(1L);
        assertThat(toDoList.getName()).isEqualTo("To Do");
        assertThat(toDoList.getBoardId()).isEqualTo(boardId);
        assertThat(toDoList.getTasks()).hasSize(1);
        assertThat(toDoList.getTasks().get(0).getName()).isEqualTo("Task 1");
        
        TaskListRs inProgressList = result.get(1);
        assertThat(inProgressList.getId()).isEqualTo(2L);
        assertThat(inProgressList.getName()).isEqualTo("In Progress");
        assertThat(inProgressList.getBoardId()).isEqualTo(boardId);
        assertThat(inProgressList.getTasks()).hasSize(1);
        assertThat(inProgressList.getTasks().get(0).getName()).isEqualTo("Task 2");
    }

    /**
     * Test getTaskList method
     * Verifies that the method filters out closed cards
     */
    @Test
    void getTaskList_ExcludesClosedCards_WhenCardIsClosed() {
        // Arrange
        Long boardId = 1001L;
        
        GetBoard200ResponseIncludedCardsInner closedCard = new GetBoard200ResponseIncludedCardsInner();
        closedCard.setId("103");
        closedCard.setName("Closed Task");
        closedCard.setListId("1");
        closedCard.setIsClosed(true);
        
        List<GetBoard200ResponseIncludedCardsInner> cardsWithClosed = new ArrayList<>(cardList);
        cardsWithClosed.add(closedCard);

        // Act
        List<TaskListRs> result = boardService.getTaskList(boardId, modelLists, cardsWithClosed);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result).hasSize(2);
        
        TaskListRs toDoList = result.get(0);
        assertThat(toDoList.getTasks()).hasSize(1); // Should not include the closed card
        assertThat(toDoList.getTasks().get(0).getName()).isNotEqualTo("Closed Task");
    }

    /**
     * Test getTaskList method
     * Verifies that the method filters out inactive lists
     */
    @Test
    void getTaskList_ExcludesInactiveLists_WhenListIsNotActive() {
        // Arrange
        Long boardId = 1001L;
        
        ModelList closedList = new ModelList();
        closedList.setId("3");
        closedList.setName("Closed List");
        closedList.setType(ModelList.TypeEnum.CLOSED);
        
        List<ModelList> listsWithInactive = new ArrayList<>(modelLists);
        listsWithInactive.add(closedList);

        // Act
        List<TaskListRs> result = boardService.getTaskList(boardId, listsWithInactive, cardList);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result).hasSize(2); // Should only include active lists
        
        List<String> listNames = result.stream()
            .map(TaskListRs::getName)
            .toList();
        assertThat(listNames).doesNotContain("Closed List");
    }
}