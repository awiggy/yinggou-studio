package com.stonewu.fusion.service.generation.image;

import com.baomidou.mybatisplus.core.MybatisConfiguration;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.TableInfoHelper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.stonewu.fusion.entity.generation.ImageTask;
import com.stonewu.fusion.mapper.generation.ImageItemMapper;
import com.stonewu.fusion.mapper.generation.ImageTaskMapper;
import org.apache.ibatis.builder.MapperBuilderAssistant;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class CharacterImageHistoryTests {
    @BeforeAll
    static void initializeMetadata() {
        TableInfoHelper.initTableInfo(new MapperBuilderAssistant(new MybatisConfiguration(), ""), ImageTask.class);
    }

    @Test
    void characterFilterAlwaysRetainsUserAndProjectScope() {
        ImageTaskMapper mapper = mock(ImageTaskMapper.class);
        when(mapper.selectPage(any(Page.class), any())).thenReturn(new Page<ImageTask>());
        ImageGenerationService service = new ImageGenerationService(mapper, mock(ImageItemMapper.class));

        service.pageByUser(7L, 1, 12, 11L, "yinggou-character:42");

        ArgumentCaptor<LambdaQueryWrapper<ImageTask>> query = ArgumentCaptor.forClass(LambdaQueryWrapper.class);
        verify(mapper).selectPage(any(Page.class), query.capture());
        assertThat(query.getValue().getSqlSegment()).contains("user_id =", "project_id =", "category =").doesNotContain(" OR ");
        assertThat(query.getValue().getParamNameValuePairs().values()).containsExactlyInAnyOrder(7L, 11L, "yinggou-character:42");
    }

    @Test
    void regularImageHistoryStillQueriesAllCategoriesForCurrentUser() {
        ImageTaskMapper mapper = mock(ImageTaskMapper.class);
        when(mapper.selectPage(any(Page.class), any())).thenReturn(new Page<ImageTask>());
        ImageGenerationService service = new ImageGenerationService(mapper, mock(ImageItemMapper.class));

        service.pageByUser(7L, 1, 10);

        ArgumentCaptor<LambdaQueryWrapper<ImageTask>> query = ArgumentCaptor.forClass(LambdaQueryWrapper.class);
        verify(mapper).selectPage(any(Page.class), query.capture());
        assertThat(query.getValue().getSqlSegment()).contains("user_id =").doesNotContain("project_id =", "category =");
        assertThat(query.getValue().getParamNameValuePairs().values()).containsExactly(7L);
    }
}
