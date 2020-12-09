<!--表格组件 -->
<template>
    <div class="z-list-page">
        <!-- 数据表格 -->
        <div class="z-list-data">
            <el-table :data='tableData' :size='size'
                      :border='showBorder'
                      @select='select'
                      @select-all='selectAll'
                      :defaultSelections='defaultSelections'
                      ref="listTable"
                      :cell-style="{padding: '4px 0'}" :max-height="maxHeight"
                      :header-cell-style="{padding: '4px 0'}" @selection-change="onSelection" highlight-current-row
                      stripe>
                <el-table-column v-if="showSelection" type="selection" width="50" align="center"></el-table-column>
                <el-table-column v-if="showIndex" type="index" :label="indexLabel" align="center"
                                 width="50"></el-table-column>
                <!-- 数据栏 -->
                <template v-for="(item,index) in tableCols">
                    <el-table-column
                                 :key="item.label"
                                 :prop="item.prop"
                                 :label="item.label"
                                 :width="item.width?item.width:'auto'"
                                 :align="item.align?item.align:'center'"
                                 :render-header="item.require?renderHeader:null"
                                 :fixed="item.fixed"
                                 :sortable="item.sort"
                                 v-if="item.visible?item.visible(item):true"
                                 :sort-method="item.sortMethod"
                >
                    <template slot-scope="scope">
                        <!-- html -->
                        <span v-if="item.type==='html'" v-html="item.html(scope.row)"></span>
                        <!-- 默认 -->
                        <span v-if="!item.type"
                              :size="size"
                              class="break-span"
                              :class="item.class"
                              :style="item.style"
                        >{{item.formatter?item.formatter(scope.row,{property:item.prop},scope.row[item.prop]):scope.row[item.prop]}}</span>
                        <!-- 按钮 -->
                        <!--                        v-if="btn.visible&&btn.visible(scope.row)"-->
                        <span v-else-if="item.type==='button'">
                            <el-button v-for="btn in item.btnList"
                                       :disabled="btn.disabled&&btn.disabled(scope.row)"
                                       :type="btn.type?btn.type:'text'"
                                       :size="btn.size?btn.size:'small'"
                                       :key="btn.label"
                                       v-show="btn.visible?btn.visible(scope.row):true"
                                       @click="btn.handle(scope.row)"
                                       v-has="btn.has?btn.has:undefined"
                                        :title="btn.title&&btn.title(scope.row)">
                                <i v-if="btn.icon" :class="btn.icon"></i>
                                <span v-else>{{btn.label}}</span></el-button>
                        </span>
                        <span v-else-if="item.type==='calculateButton'">
                            <el-button v-for="btn in item.getBtnList&&item.getBtnList(scope.row)"
                                       :disabled="btn.disabled&&btn.disabled(scope.row)"
                                       :type="btn.type?btn.type:'text'"
                                       :size="btn.size?btn.size:'small'"
                                       :key="btn.label"
                                       v-show="btn.visible?btn.visible(scope.row):true"
                                       @click="btn.handle(scope.row,btn)"
                                       v-has="btn.has?btn.has:undefined">
                                <i v-if="btn.icon" :class="btn.icon"></i>
                                <span v-else>{{btn.label}}</span></el-button>
                        </span>
                        <span v-else-if="item.type=='singlebutton'">
                            <el-button :disabled="item.disabled&&item.disabled(scope.row)"
                                       :type="item.buttonType?item.buttonType:'text'"
                                       :size="item.size?item.size:'small'"
                                       :icon="item.icon"
                                       :key="item.label"
                                       v-show="item.visible?item.visible(scope.row):true"
                                       @click="item.handle(scope.row)" v-has="item.has?item.has:undefined">{{item.formatter?item.formatter(scope.row,{property:item.prop},scope.row[item.prop]):scope.row[item.prop]}}</el-button>
                        </span>
                        <!-- 输入框 -->
                        <el-input v-else-if="item.type==='input'" v-model="scope.row[item.prop]" :size="size"
                                  :disabled="item.disabled && item.disabled(scope.row)"
                                  @focus="item.focus && item.focus(scope.row)"></el-input>
                        <!-- 下拉框 -->
                        <el-select v-else-if="item.type==='select'" v-model="scope.row[item.prop]" :size="size"
                                   :props="item.props"
                                   :disabled="item.disabled && item.disabled(scope.row)"
                                   @change='item.change && item.change(that,scope.row)'>
                            <el-option v-for="op in item.options" :label="op.label" :value="op.value"
                                       :key="op.value"></el-option>
                        </el-select>
                        <el-radio v-else-if="item.type==='radio'" v-model="selected" :label="scope.row"
                                  :disabled="item.disabled && item.disabled(scope.row)"
                                  :size="size"
                                  @change='item.change && item.change(scope.row,index)'>&nbsp
                        </el-radio>
                        <!-- 复选框 -->
<!--                        <el-checkbox-group v-else-if="item.type==='checkbox'" v-model="scope.row[item.prop]"-->
<!--                                           :disabled="item.disabled && item.disabled(scope.row)"-->
<!--                                           :size="size"-->
<!--                                           @change='item.change && item.change(that,scope.row)'>-->
<!--                            <el-checkbox v-for="ra in item.typeSet.data" :label="ra.value" :key='ra.value'>{{ra.label}}-->
<!--                            </el-checkbox>-->
<!--                        </el-checkbox-group>-->
                        <!-- 评价 -->
                        <el-rate v-else-if="item.type==='rate'" v-model="scope.row[item.prop]"
                                 :disabled="item.disabled && item.disabled(scope.row)" :size="size"
                                 @change='item.change && item.change(scope.row)'></el-rate>
                        <!-- 开关 -->
                        <el-switch v-else-if="item.type==='switch'" v-model="scope.row[item.prop]" :size="size"
                                   :active-value='item.values&&item.values[0]'
                                   :inactive-value='item.values&&item.values[1]'
                                   :disabled="item.disabled && item.disabled(scope.row)"
                                   @change='item.change && item.change(scope.row)'></el-switch>
                        <img v-else-if="item.type==='image' && scope.row[item.prop]" :src="scope.row[item.prop]"
                             style="display: none;"
                             @load="loadImg"
                             width="60"
                             @click="clickImg(scope.row[item.prop])"/>
                        <!-- 滑块 -->
                        <el-slider v-else-if="item.type==='slider'" v-model="scope.row[item.prop]"
                                   :disabled="item.disabled && item.disabled(scope.row)" :size="size"
                                   @change='item.change && item.change(scope.row)'></el-slider>
                        <template v-else-if="item.type==='link'">
                            <el-link  @click="item.handle(scope.row)" type="primary" :disabled="item.disabled&&item.disabled(scope.row)">
                                {{item.formatter?item.formatter(scope.row,{property:item.prop},scope.row[item.prop]):scope.row[item.prop]}}
                            </el-link>
                            <template v-if="item.contentFormatter">
                                <br/>
                                <span>{{item.contentFormatter(scope.row)}}</span>
                            </template>
                        </template>
<!--                        <a v-else-if="item.type==='link'" @click="item.handle(scope.row)"  class="linkInTable">{{item.formatter?item.formatter(scope.row,{property:item.prop},scope.row[item.prop]):scope.row[item.prop]}}</a>-->
                        <span v-if="item.html" v-html="item.html(scope.row)" @click="item.htmlHandle&&item.htmlHandle(scope.row)"></span>

                    </template>
                </el-table-column>
                </template>
            </el-table>
        </div>
        <div class="text-center pager-box mt-6" v-if="showPagination">
            <el-pagination
                    @size-change="handleSizeChange"
                    @current-change="handleCurrentChange"
                    @prev-click="handlePrev"
                    @next-click="handleNext"
                    :current-page="tablePage.page_no"
                    :page-sizes="pageSizes"
                    :page-size="tablePage.page_size"
                    :total="tablePage.total_count"
                    class="inline-block"
                    layout="total, sizes, prev, pager, next, jumper"
                    style="display:inline-block;margin-left: 6px;">
            </el-pagination>
        </div>
    </div>
</template>

<script>
    export default {
        name: 'DataList',
        props: {
            //查询参数列表
            queryParamList: {type: Array, default: () => []},

            that: {type: Object, default: this},
            // 表格型号：mini,medium,small
            size: {type: String, default: 'medium'},
            showBorder: {type: Boolean, default: true},
            // loading: {type: Boolean, default: false},//加载状态

            tableHandles: {type: Array, default: () => []},
            // 表格数据
            tableData: {type: Array, default: () => []},
            // 表格列配置
            tableCols: {type: Array, default: () => []},
            // 是否显示表格复选框
            showSelection: {type: Boolean, default: false},
            defaultSelections: {type: [Array, Object], default: () => null},
            // 是否显示表格索引
            showIndex: {type: Boolean, default: false},
            indexLabel: {type: String, default: '序号'},
            // 是否显示分页
            showPagination: {type: Boolean, default: true},
            // 分页数据
            tablePage: {type: Object, default: () => ({page_size: 15, page_no: 1, total_count: 0})},
            maxHeight:{type: Number, default: undefined}
        },
        data() {
            return {
                data: [],
                pageSizes: [15, 25, 50, 75, 100, 200],
                selectionList: [],
                selected: undefined,
                showImg:false,
                imgSrc:'',
            }
        },
        watch: {
            'defaultSelections'(val) {
                this.$nextTick(function () {
                    if (Array.isArray(val)) {
                        val.forEach(row => {
                            this.$refs.listTable.toggleRowSelection(row)
                        })
                    } else {
                        this.$refs.listTable.toggleRowSelection(val)
                    }
                })
            },
            tableData(val) {
                this.selected = undefined
            }
        },
        methods: {
            // 表格勾选
            select(rows, row) {
                this.$emit('select', rows, row);
            },
            // 全选
            selectAll(rows) {
                this.$emit('select', rows)
            },

            handleCurrentChange(page) {
                this.tablePage.page_no = page;
                this.onSearch()
            },
            handleSizeChange(size) {
                this.tablePage.page_size = size;
                this.tablePage.page_no = 1;
                this.onSearch()
            },
            handlePrev(page) {
                this.tablePage.page_no = page;
                this.onSearch()
            },
            handleNext(page) {
                this.tablePage.page_no = page
                this.onSearch()
            },
            onSearch() {
                this.$emit('onSearch')
            },
            renderHeader(h, obj) {
                return h('span', {class: 'ces-table-require'}, obj.column.label)
            },
            onSelection(val) {
                this.selectionList = val
                this.$emit('onSelection', val)
            },
            loadImg(e) {
                e.target.style.display = 'inline-block'
            },
            clickImg (url) {
                if(!url)return
                this.showImg = true
                this.imgSrc = url
            },
            viewImg () {
                this.showImg = false
            }
        },
    }
</script>
<style lang="scss">
    .ces-table-require::before {
        content: '*';
        color: red;
    }

    .z-list-page {
        /*height: 100%;*/
    }

    .z-list-data {
        /*height: 100%*/
    }

    .break-span {
        /*word-break:normal;*/
        /*width:auto;*/
        /*display:block;*/
        white-space: pre-wrap;
        /*word-wrap : break-word ;*/
        /*overflow: hidden ;*/
    }
    .ellipsis-3{
        display: -webkit-box;
        overflow: hidden;
        text-overflow: ellipsis;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
    }
</style>
