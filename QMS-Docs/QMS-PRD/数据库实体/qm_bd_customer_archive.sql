/*
 Navicat Premium Dump SQL

 Source Server         : QMS-MySql8.0-QMS(DEV)
 Source Server Type    : MySQL
 Source Server Version : 80040 (8.0.40)
 Source Host           : 192.168.10.3:3308
 Source Schema         : sot_cloud

 Target Server Type    : MySQL
 Target Server Version : 80040 (8.0.40)
 File Encoding         : 65001

 Date: 06/03/2026 18:47:31
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for qm_bd_customer_archive
-- ----------------------------
DROP TABLE IF EXISTS `qm_bd_customer_archive`;
CREATE TABLE `qm_bd_customer_archive`  (
  `f_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '自然主键',
  `org_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '组织ID',
  `customer_code` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '客户编码',
  `customer_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '客户名称',
  `customer_grade` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '客户等级',
  `credit_level` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '信用等级（支持小数，如0.5、3.5等）',
  `social_credit_code` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '统一社会信用代码',
  `contact_phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '联系电话',
  `contact_email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '邮箱地址',
  `legal_representative` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '法定代表人',
  `detailed_address` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '详细地址',
  `opening_bank` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '开户银行',
  `bank_account_number` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '银行账号',
  `remark` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '备注',
  `f_sort_code` bigint NULL DEFAULT NULL COMMENT '排序',
  `f_enabled_mark` int NULL DEFAULT 1 COMMENT '状态（1-启用, 0-停用）',
  `f_delete_mark` int NULL DEFAULT 0 COMMENT '是否删除（1-已删除, 0-未删除）',
  `f_tenant_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '租户ID',
  `f_delete_time` datetime NULL DEFAULT NULL COMMENT '删除时间',
  `f_delete_user_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '删除人ID',
  `f_description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL COMMENT '描述',
  `f_creator_time` datetime NULL DEFAULT NULL COMMENT '创建时间',
  `f_last_modify_time` datetime NULL DEFAULT NULL COMMENT '最后修改时间',
  `f_creator_user_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '创建人ID',
  `f_last_modify_user_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '最后修改人ID',
  PRIMARY KEY (`f_id`) USING BTREE,
  INDEX `idx_org_id`(`org_id` ASC) USING BTREE,
  INDEX `idx_customer_code`(`customer_code` ASC) USING BTREE,
  INDEX `idx_customer_name`(`customer_name` ASC) USING BTREE,
  INDEX `idx_customer_grade`(`customer_grade` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '客户档案表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for qm_bd_customer_qualification
-- ----------------------------
DROP TABLE IF EXISTS `qm_bd_customer_qualification`;
CREATE TABLE `qm_bd_customer_qualification`  (
  `f_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '自然主键',
  `customer_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '客户档案ID（关联qm_bd_customer_archive.f_id）',
  `file_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '文件名称',
  `file_path` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '文件地址',
  `qualification_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '资质类型（如：营业执照、资质证书等）',
  `validity_date` date NULL DEFAULT NULL COMMENT '资质有效期',
  `upload_time` datetime NULL DEFAULT NULL COMMENT '上传时间',
  `uploader_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '上传人ID',
  `remark` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '备注',
  `f_sort_code` bigint NULL DEFAULT NULL COMMENT '排序',
  `f_enabled_mark` int NULL DEFAULT 1 COMMENT '状态（1-启用, 0-停用）',
  `f_delete_mark` int NULL DEFAULT 0 COMMENT '是否删除（1-已删除, 0-未删除）',
  `f_tenant_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '租户ID',
  `f_delete_time` datetime NULL DEFAULT NULL COMMENT '删除时间',
  `f_delete_user_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '删除人ID',
  `f_description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL COMMENT '描述',
  `f_creator_time` datetime NULL DEFAULT NULL COMMENT '创建时间',
  `f_last_modify_time` datetime NULL DEFAULT NULL COMMENT '最后修改时间',
  `f_creator_user_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '创建人ID',
  `f_last_modify_user_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '最后修改人ID',
  PRIMARY KEY (`f_id`) USING BTREE,
  INDEX `idx_customer_id`(`customer_id` ASC) USING BTREE,
  INDEX `idx_qualification_type`(`qualification_type` ASC) USING BTREE,
  CONSTRAINT `fk_customer_id` FOREIGN KEY (`customer_id`) REFERENCES `qm_bd_customer_archive` (`f_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '客户资质附件表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for qm_bd_material_archive
-- ----------------------------
DROP TABLE IF EXISTS `qm_bd_material_archive`;
CREATE TABLE `qm_bd_material_archive`  (
  `f_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '自然主键',
  `org_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '组织ID',
  `material_code` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '物料编码',
  `material_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '物料名称',
  `specification` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '规格型号',
  `unit_id` bigint NULL DEFAULT NULL COMMENT '计量单位ID',
  `source` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '来源（字典MaterialsSource）',
  `national_standard_code` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '国标码',
  `shelf_life` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '保质期(天)',
  `gross_weight` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '毛重(kg)',
  `dimensions` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '尺寸(mm)',
  `operation` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '操作类型（CREATE/UPDATE/DELETE）',
  `plm_material_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT 'PLM物料ID',
  `plm_material_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT 'PLM物料编码',
  `material_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '物料类型（RAW/SEMI/FINISHED/PACKAGE/AUXILIARY），即物料所属分类',
  `material_version` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '物料版本',
  `unit` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '计量单位（PCS/KG/M/SET）',
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '物料状态（ACTIVE/INACTIVE/OBSOLETE）',
  `customer_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '客户编码',
  `customer_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '客户名称',
  `supplier_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '供应商编码',
  `supplier_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '供应商名称',
  `product_family` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '产品系列',
  `brand` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '品牌',
  `model` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '型号',
  `weight` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '重量(kg)',
  `volume` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '体积(m³)',
  `color` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '颜色',
  `material_group` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '物料组',
  `safety_stock` int NULL DEFAULT NULL COMMENT '安全库存',
  `min_order_qty` int NULL DEFAULT NULL COMMENT '最小订购量',
  `lead_time` int NULL DEFAULT NULL COMMENT '提前期(天)',
  `is_key_component` int NULL DEFAULT 0 COMMENT '是否关键组件（1-是, 0-否）',
  `is_environment_related` int NULL DEFAULT 0 COMMENT '是否环保相关（1-是, 0-否）',
  `is_hazardous` int NULL DEFAULT 0 COMMENT '是否危险品（1-是, 0-否）',
  `effective_date` date NULL DEFAULT NULL COMMENT '生效日期',
  `expiry_date` date NULL DEFAULT NULL COMMENT '失效日期',
  `technical_parameters` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL COMMENT '技术参数(JSON)',
  `plm_create_time` datetime NULL DEFAULT NULL COMMENT 'PLM创建时间',
  `plm_update_time` datetime NULL DEFAULT NULL COMMENT 'PLM更新时间',
  `plm_operator` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT 'PLM操作人',
  `remark` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '备注',
  `f_sort_code` bigint NULL DEFAULT NULL COMMENT '排序',
  `f_enabled_mark` int NULL DEFAULT 1 COMMENT '状态（1-启用, 0-停用）',
  `f_delete_mark` int NULL DEFAULT 0 COMMENT '是否删除（1-已删除, 0-未删除）',
  `f_tenant_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '租户ID',
  `f_delete_time` datetime NULL DEFAULT NULL COMMENT '删除时间',
  `f_delete_user_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '删除人ID',
  `f_description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL COMMENT '描述',
  `f_creator_time` datetime NULL DEFAULT NULL COMMENT '创建时间',
  `f_last_modify_time` datetime NULL DEFAULT NULL COMMENT '最后修改时间',
  `f_creator_user_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '创建人ID',
  `f_last_modify_user_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '最后修改人ID',
  PRIMARY KEY (`f_id`) USING BTREE,
  INDEX `idx_org_id`(`org_id` ASC) USING BTREE,
  INDEX `idx_material_code`(`material_code` ASC) USING BTREE,
  INDEX `idx_material_name`(`material_name` ASC) USING BTREE,
  INDEX `idx_plm_material_id`(`plm_material_id` ASC) USING BTREE,
  INDEX `idx_plm_material_code`(`plm_material_code` ASC) USING BTREE,
  INDEX `idx_material_type`(`material_type` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '物料档案表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for qm_bd_material_category
-- ----------------------------
DROP TABLE IF EXISTS `qm_bd_material_category`;
CREATE TABLE `qm_bd_material_category`  (
  `f_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '自然主键',
  `org_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '组织ID',
  `category_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '分类名称',
  `category_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '分类编码',
  `parent_category` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '上级分类编码',
  `f_sort_code` bigint NULL DEFAULT NULL COMMENT '排序',
  `f_enabled_mark` int NULL DEFAULT 1 COMMENT '状态（1-启用, 0-停用）',
  `f_delete_mark` int NULL DEFAULT 0 COMMENT '是否删除（1-已删除, 0-未删除）',
  `f_tenant_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '租户ID',
  `f_delete_time` datetime NULL DEFAULT NULL COMMENT '删除时间',
  `f_delete_user_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '删除人ID',
  `f_description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL COMMENT '描述',
  `f_creator_time` datetime NULL DEFAULT NULL COMMENT '创建时间',
  `f_last_modify_time` datetime NULL DEFAULT NULL COMMENT '最后修改时间',
  `f_creator_user_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '创建人ID',
  `f_last_modify_user_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '最后修改人ID',
  PRIMARY KEY (`f_id`) USING BTREE,
  INDEX `idx_org_id`(`org_id` ASC) USING BTREE,
  INDEX `idx_category_code`(`category_code` ASC) USING BTREE,
  INDEX `idx_category_name`(`category_name` ASC) USING BTREE,
  INDEX `idx_parent_category`(`parent_category` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '物料分类表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for qm_bd_material_insp_spec
-- ----------------------------
DROP TABLE IF EXISTS `qm_bd_material_insp_spec`;
CREATE TABLE `qm_bd_material_insp_spec`  (
  `f_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '自然主键',
  `material_archive_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '物料档案ID',
  `insp_item` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '检验项',
  `data_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '数据类型（字典MaterialArchiveDataType）',
  `usl` decimal(10, 6) NULL DEFAULT NULL COMMENT '规格上限',
  `standard_sl` decimal(10, 6) NULL DEFAULT NULL COMMENT '规格标准',
  `lsl` decimal(10, 6) NULL DEFAULT NULL COMMENT '规格下限',
  `unit` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '单位',
  `f_sort_code` bigint NULL DEFAULT NULL COMMENT '排序',
  `f_enabled_mark` int NULL DEFAULT 1 COMMENT '状态（1-启用, 0-停用）',
  `f_delete_mark` int NULL DEFAULT 0 COMMENT '是否删除（1-已删除, 0-未删除）',
  `f_tenant_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '租户ID',
  `f_delete_time` datetime NULL DEFAULT NULL COMMENT '删除时间',
  `f_delete_user_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '删除人ID',
  `f_description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL COMMENT '描述',
  `f_creator_time` datetime NULL DEFAULT NULL COMMENT '创建时间',
  `f_last_modify_time` datetime NULL DEFAULT NULL COMMENT '最后修改时间',
  `f_creator_user_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '创建人ID',
  `f_last_modify_user_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '最后修改人ID',
  PRIMARY KEY (`f_id`) USING BTREE,
  INDEX `idx_material_archive_id`(`material_archive_id` ASC) USING BTREE,
  INDEX `idx_data_type`(`data_type` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '物料检验规格表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for qm_bd_measure_unit
-- ----------------------------
DROP TABLE IF EXISTS `qm_bd_measure_unit`;
CREATE TABLE `qm_bd_measure_unit`  (
  `f_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '自然主键',
  `org_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '组织ID',
  `unit_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '单位编码',
  `unit_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '单位名称',
  `unit_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '单位类型（由系统字典配置）',
  `base_unit_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '换算基准单位编码',
  `conversion_factor` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '换算系数',
  `is_base_unit` int NULL DEFAULT 0 COMMENT '是否基准单位（1-是, 0-否）',
  `f_sort_code` bigint NULL DEFAULT NULL COMMENT '排序',
  `f_enabled_mark` int NULL DEFAULT 1 COMMENT '状态（1-启用, 0-停用）',
  `f_delete_mark` int NULL DEFAULT 0 COMMENT '是否删除（1-已删除, 0-未删除）',
  `f_tenant_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '租户ID',
  `f_delete_time` datetime NULL DEFAULT NULL COMMENT '删除时间',
  `f_delete_user_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '删除人ID',
  `f_description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL COMMENT '描述',
  `f_creator_time` datetime NULL DEFAULT NULL COMMENT '创建时间',
  `f_last_modify_time` datetime NULL DEFAULT NULL COMMENT '最后修改时间',
  `f_creator_user_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '创建人ID',
  `f_last_modify_user_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '最后修改人ID',
  PRIMARY KEY (`f_id`) USING BTREE,
  INDEX `idx_org_id`(`org_id` ASC) USING BTREE,
  INDEX `idx_unit_code`(`unit_code` ASC) USING BTREE,
  INDEX `idx_unit_name`(`unit_name` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '计量单位表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for qm_bd_operation_insp_config
-- ----------------------------
DROP TABLE IF EXISTS `qm_bd_operation_insp_config`;
CREATE TABLE `qm_bd_operation_insp_config`  (
  `f_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '自然主键',
  `operation_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '工序ID',
  `inspection_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '检验类型（FIRST_PIECE/PROCESS/FINAL等）',
  `inspection_plan_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '检验方案ID',
  `f_sort_code` bigint NULL DEFAULT NULL COMMENT '排序',
  `f_enabled_mark` int NULL DEFAULT 1 COMMENT '状态（1-启用, 0-停用）',
  `f_delete_mark` int NULL DEFAULT 0 COMMENT '是否删除（1-已删除, 0-未删除）',
  `f_tenant_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '租户ID',
  `f_delete_time` datetime NULL DEFAULT NULL COMMENT '删除时间',
  `f_delete_user_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '删除人ID',
  `f_description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL COMMENT '描述',
  `f_creator_time` datetime NULL DEFAULT NULL COMMENT '创建时间',
  `f_last_modify_time` datetime NULL DEFAULT NULL COMMENT '最后修改时间',
  `f_creator_user_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '创建人ID',
  `f_last_modify_user_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '最后修改人ID',
  PRIMARY KEY (`f_id`) USING BTREE,
  INDEX `idx_operation_id`(`operation_id` ASC) USING BTREE,
  INDEX `idx_inspection_type`(`inspection_type` ASC) USING BTREE,
  INDEX `idx_inspection_plan_id`(`inspection_plan_id` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '工序检验配置表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for qm_bd_process_route
-- ----------------------------
DROP TABLE IF EXISTS `qm_bd_process_route`;
CREATE TABLE `qm_bd_process_route`  (
  `f_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '自然主键',
  `org_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '组织ID',
  `route_code` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '路线编码',
  `route_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '路线名称',
  `route_version` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '版本号',
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT 'DRAFT' COMMENT '状态（DRAFT-草稿, ACTIVE-生效, INACTIVE-失效）',
  `remark` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '备注',
  `f_sort_code` bigint NULL DEFAULT NULL COMMENT '排序',
  `f_enabled_mark` int NULL DEFAULT 1 COMMENT '状态（1-启用, 0-停用）',
  `f_delete_mark` int NULL DEFAULT 0 COMMENT '是否删除（1-已删除, 0-未删除）',
  `f_tenant_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '租户ID',
  `f_delete_time` datetime NULL DEFAULT NULL COMMENT '删除时间',
  `f_delete_user_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '删除人ID',
  `f_description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL COMMENT '描述',
  `f_creator_time` datetime NULL DEFAULT NULL COMMENT '创建时间',
  `f_last_modify_time` datetime NULL DEFAULT NULL COMMENT '最后修改时间',
  `f_creator_user_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '创建人ID',
  `f_last_modify_user_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '最后修改人ID',
  PRIMARY KEY (`f_id`) USING BTREE,
  INDEX `idx_org_id`(`org_id` ASC) USING BTREE,
  INDEX `idx_route_code`(`route_code` ASC) USING BTREE,
  INDEX `idx_route_name`(`route_name` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '工艺路线表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for qm_bd_route_material
-- ----------------------------
DROP TABLE IF EXISTS `qm_bd_route_material`;
CREATE TABLE `qm_bd_route_material`  (
  `f_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '自然主键',
  `route_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '工艺路线ID',
  `material_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '物料档案ID',
  `f_sort_code` bigint NULL DEFAULT NULL COMMENT '排序',
  `f_enabled_mark` int NULL DEFAULT 1 COMMENT '状态（1-启用, 0-停用）',
  `f_delete_mark` int NULL DEFAULT 0 COMMENT '是否删除（1-已删除, 0-未删除）',
  `f_tenant_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '租户ID',
  `f_delete_time` datetime NULL DEFAULT NULL COMMENT '删除时间',
  `f_delete_user_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '删除人ID',
  `f_description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL COMMENT '描述',
  `f_creator_time` datetime NULL DEFAULT NULL COMMENT '创建时间',
  `f_last_modify_time` datetime NULL DEFAULT NULL COMMENT '最后修改时间',
  `f_creator_user_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '创建人ID',
  `f_last_modify_user_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '最后修改人ID',
  PRIMARY KEY (`f_id`) USING BTREE,
  INDEX `idx_route_id`(`route_id` ASC) USING BTREE,
  INDEX `idx_material_id`(`material_id` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '工艺路线物料关联表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for qm_bd_route_operation
-- ----------------------------
DROP TABLE IF EXISTS `qm_bd_route_operation`;
CREATE TABLE `qm_bd_route_operation`  (
  `f_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '自然主键',
  `route_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '工艺路线ID',
  `org_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '组织ID',
  `operation` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '操作类型（CREATE/UPDATE/DELETE）',
  `product_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '产品编码',
  `product_version` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '产品版本',
  `route_version` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '工艺路线版本',
  `operation_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '工序编码',
  `operation_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '工序名称',
  `sequence_number` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '工序序号（文本存储）',
  `work_center_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '工作中心编码',
  `work_center_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '工作中心名称',
  `equipment_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '设备编码',
  `equipment_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '设备名称',
  `equipment_type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '设备类型',
  `standard_time` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '标准工时(分钟，文本存储)',
  `setup_time` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '准备时间(分钟，文本存储)',
  `is_inspection_point` int NULL DEFAULT 0 COMMENT '是否检验点（1-是, 0-否）',
  `inspection_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '检验类型',
  `inspection_frequency` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '检验频次',
  `quality_control_point` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '质量控制点',
  `special_instructions` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '特殊说明',
  `skill_level` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '技能等级',
  `operation_parameters` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL COMMENT '工序参数(JSON)',
  `effective_date` date NULL DEFAULT NULL COMMENT '生效日期',
  `expiry_date` date NULL DEFAULT NULL COMMENT '失效日期',
  `remark` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '备注',
  `plm_create_time` datetime NULL DEFAULT NULL COMMENT 'PLM创建时间',
  `plm_update_time` datetime NULL DEFAULT NULL COMMENT 'PLM更新时间',
  `plm_operator` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT 'PLM操作人',
  `f_sort_code` bigint NULL DEFAULT NULL COMMENT '排序',
  `f_enabled_mark` int NULL DEFAULT 1 COMMENT '状态（1-启用, 0-停用）',
  `f_delete_mark` int NULL DEFAULT 0 COMMENT '是否删除（1-已删除, 0-未删除）',
  `f_tenant_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '租户ID',
  `f_delete_time` datetime NULL DEFAULT NULL COMMENT '删除时间',
  `f_delete_user_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '删除人ID',
  `f_description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL COMMENT '描述',
  `f_creator_time` datetime NULL DEFAULT NULL COMMENT '创建时间',
  `f_last_modify_time` datetime NULL DEFAULT NULL COMMENT '最后修改时间',
  `f_creator_user_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '创建人ID',
  `f_last_modify_user_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '最后修改人ID',
  PRIMARY KEY (`f_id`) USING BTREE,
  INDEX `idx_route_id`(`route_id` ASC) USING BTREE,
  INDEX `idx_operation_code`(`operation_code` ASC) USING BTREE,
  INDEX `idx_sequence_number`(`sequence_number` ASC) USING BTREE,
  INDEX `idx_is_inspection_point`(`is_inspection_point` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '工艺路线工序表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for qm_md_defect_category
-- ----------------------------
DROP TABLE IF EXISTS `qm_md_defect_category`;
CREATE TABLE `qm_md_defect_category`  (
  `f_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '自然主键',
  `f_parent_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '上级',
  `org_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '组织ID',
  `category_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '分类代码',
  `category_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '分类名称',
  `description` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '描述',
  `f_enabled_mark` int NOT NULL DEFAULT 1 COMMENT '有效标志',
  `f_sort_code` bigint NULL DEFAULT NULL COMMENT '排序',
  `f_creator_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `f_creator_user_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '创建用户',
  `f_last_modify_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '修改时间',
  `f_last_modify_user_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '修改用户',
  `f_delete_time` datetime NULL DEFAULT NULL COMMENT '删除时间',
  `f_delete_user_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '删除用户',
  `f_delete_mark` int NOT NULL DEFAULT 0 COMMENT '删除标志',
  `f_tenant_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '0' COMMENT '租户id',
  PRIMARY KEY (`f_id`) USING BTREE,
  UNIQUE INDEX `uk_tenant_id`(`f_tenant_id` ASC, `f_id` ASC) USING BTREE,
  INDEX `idx_tenant_id`(`f_tenant_id` ASC) USING BTREE,
  INDEX `idx_parent_id`(`f_parent_id` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '缺陷分类表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for qm_md_defect_cause
-- ----------------------------
DROP TABLE IF EXISTS `qm_md_defect_cause`;
CREATE TABLE `qm_md_defect_cause`  (
  `f_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '自然主键',
  `f_parent_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '-1' COMMENT '上级',
  `org_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '组织ID',
  `code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '代码',
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '名称',
  `category` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '原因大类(枚举值)',
  `is_high_frequency` tinyint(1) NOT NULL DEFAULT 1 COMMENT '是否高频原因（1-是, 0-否）',
  `description` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '描述',
  `f_enabled_mark` int NOT NULL DEFAULT 1 COMMENT '有效标志',
  `f_sort_code` bigint NULL DEFAULT NULL COMMENT '排序',
  `f_creator_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `f_creator_user_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '创建用户',
  `f_last_modify_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '修改时间',
  `f_last_modify_user_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '修改用户',
  `f_delete_time` datetime NULL DEFAULT NULL COMMENT '删除时间',
  `f_delete_user_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '删除用户',
  `f_delete_mark` int NOT NULL DEFAULT 0 COMMENT '删除标志',
  `f_tenant_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '0' COMMENT '租户id',
  PRIMARY KEY (`f_id`) USING BTREE,
  UNIQUE INDEX `uk_tenant_id`(`f_tenant_id` ASC, `f_id` ASC) USING BTREE,
  INDEX `idx_parent_id`(`f_parent_id` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '不良原因表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for qm_md_defect_phenomenon
-- ----------------------------
DROP TABLE IF EXISTS `qm_md_defect_phenomenon`;
CREATE TABLE `qm_md_defect_phenomenon`  (
  `f_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '自然主键',
  `org_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '组织ID',
  `category_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '不良类型ID',
  `code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '代码',
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '名称',
  `severity` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '严重等级',
  `process_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '适用工序类型',
  `description` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '描述',
  `f_enabled_mark` int NOT NULL DEFAULT 1 COMMENT '有效标志',
  `f_sort_code` bigint NULL DEFAULT NULL COMMENT '排序',
  `f_creator_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `f_creator_user_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '创建用户',
  `f_last_modify_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '修改时间',
  `f_last_modify_user_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '修改用户',
  `f_delete_time` datetime NULL DEFAULT NULL COMMENT '删除时间',
  `f_delete_user_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '删除用户',
  `f_delete_mark` int NOT NULL DEFAULT 0 COMMENT '删除标志',
  `f_tenant_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '0' COMMENT '租户id',
  PRIMARY KEY (`f_id`) USING BTREE,
  UNIQUE INDEX `uk_tenant_id`(`f_tenant_id` ASC, `f_id` ASC) USING BTREE,
  INDEX `idx_tenant_id`(`f_tenant_id` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '不良现象库' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for qm_md_insp_item
-- ----------------------------
DROP TABLE IF EXISTS `qm_md_insp_item`;
CREATE TABLE `qm_md_insp_item`  (
  `f_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '主键（建议使用业务编码或UUID，如 ITEM-G-HARDNESS）',
  `org_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '组织ID；NULL 表示集团级标准检验项目',
  `code` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '检查项编码（在 org_id 范围内唯一）',
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '检查项名称',
  `category` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '分类：尺寸,外观,理化,功能 等',
  `data_type` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '数据类型：QUANTITATIVE（计量）, QUALITATIVE（计数）',
  `unit_code` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '单位CODE：mm',
  `insp_method_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '检验方法，关联 qm_md_insp_method.f_id',
  `measure_type_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '量具类型，关联 qm_md_measure_type.f_id',
  `enable_lab` int NOT NULL DEFAULT 0 COMMENT '送实验室（1-是, 0-否）',
  `enable_spc` int NOT NULL DEFAULT 0 COMMENT '送实验室（1-是, 0-否）',
  `f_tenant_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '0' COMMENT '租户ID',
  `f_enabled_mark` int NOT NULL DEFAULT 1 COMMENT '有效标志（1-启用, 0-禁用）',
  `f_description` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '描述',
  `f_sort_code` bigint NULL DEFAULT NULL COMMENT '排序码',
  `f_creator_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `f_creator_user_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '创建用户ID',
  `f_last_modify_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后修改时间',
  `f_last_modify_user_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '最后修改用户ID',
  `f_delete_time` datetime NULL DEFAULT NULL COMMENT '删除时间',
  `f_delete_user_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '删除用户',
  `f_delete_mark` int NOT NULL DEFAULT 0 COMMENT '删除标志',
  PRIMARY KEY (`f_id`) USING BTREE,
  UNIQUE INDEX `uk_org_code`(`org_id` ASC, `code` ASC) USING BTREE,
  INDEX `idx_org_id`(`org_id` ASC) USING BTREE,
  INDEX `idx_code`(`code` ASC) USING BTREE,
  INDEX `idx_category`(`category` ASC) USING BTREE,
  INDEX `idx_data_type`(`data_type` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '检验项目标准库（支持集团级与工厂私有项目）' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for qm_md_insp_method
-- ----------------------------
DROP TABLE IF EXISTS `qm_md_insp_method`;
CREATE TABLE `qm_md_insp_method`  (
  `f_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '主键（自然主键，如 UUID 或编码）',
  `org_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '组织ID；NULL 表示集团级标准方法',
  `method_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '方法名称，需全局语义唯一',
  `operation_text` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL COMMENT '操作步骤描述（支持富文本）',
  `attachment_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '附件ID（如 SIP 文件：FILE_SOP_001.pdf）',
  `f_tenant_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '0' COMMENT '租户id',
  `f_enabled_mark` int NOT NULL DEFAULT 1 COMMENT '有效标志（1-启用, 0-禁用）',
  `f_delete_mark` int NOT NULL DEFAULT 0 COMMENT '删除标志（1-已删除, 0-未删除）',
  `f_description` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '描述',
  `f_sort_code` bigint NULL DEFAULT NULL COMMENT '排序码',
  `f_creator_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `f_creator_user_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '创建用户',
  `f_last_modify_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '修改时间',
  `f_last_modify_user_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '修改用户',
  `f_delete_user_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '删除用户',
  `f_delete_time` datetime NULL DEFAULT CURRENT_TIMESTAMP COMMENT '删除时间',
  PRIMARY KEY (`f_id`) USING BTREE,
  UNIQUE INDEX `uk_org_method_name`(`org_id` ASC, `method_name` ASC) USING BTREE,
  INDEX `idx_org_id`(`org_id` ASC) USING BTREE,
  INDEX `idx_method_name`(`method_name` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '检验方法库（WI/SIP）' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for qm_md_insp_template_detail
-- ----------------------------
DROP TABLE IF EXISTS `qm_md_insp_template_detail`;
CREATE TABLE `qm_md_insp_template_detail`  (
  `f_id` bigint NOT NULL COMMENT '主键 (雪花算法或分布式ID)',
  `template_id` bigint NOT NULL COMMENT '检验模板ID',
  `insp_item_id` bigint NOT NULL COMMENT '检验项ID (关联qm_md_defect_inspection_item)',
  `characteristic_class` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '特性分类 (DIMENSION/APPEARANCE/PERFORMANCE/MATERIAL/OTHER)',
  `sampling_rule_code` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '抽样规则编码',
  `phenomenon_id` bigint NULL DEFAULT NULL COMMENT '关联不良现象ID',
  `insp_method_id` bigint NULL DEFAULT NULL COMMENT '检验方法ID',
  `gauge_type_id` bigint NULL DEFAULT NULL COMMENT '量检具类型ID',
  `freq_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT 'IPQC频次类型 (PER_BATCH-按批次/PER_HOUR-按小时/PER_SHIFT-按班次/PER_DAY-按天)',
  `freq_value` int NULL DEFAULT NULL COMMENT '频次值',
  `freq_unit` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '频次单位',
  `enable_spc` int NULL DEFAULT 0 COMMENT 'SPC控制 (1-是, 0-否)',
  `enable_lab` int NULL DEFAULT 0 COMMENT '实验室检验 (1-是, 0-否)',
  `f_tenant_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '0' COMMENT '租户ID',
  `f_sort_code` int NULL DEFAULT 0 COMMENT '排序码',
  `f_description` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '备注',
  `f_creator_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `f_creator_user_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '创建用户ID',
  `f_last_modify_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '修改时间',
  `f_last_modify_user_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '修改用户ID',
  PRIMARY KEY (`f_id`) USING BTREE,
  INDEX `idx_template_id`(`template_id` ASC) USING BTREE,
  INDEX `idx_insp_item_id`(`insp_item_id` ASC) USING BTREE,
  INDEX `idx_tenant`(`f_tenant_id` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '检验模板明细' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for qm_md_insp_template_history
-- ----------------------------
DROP TABLE IF EXISTS `qm_md_insp_template_history`;
CREATE TABLE `qm_md_insp_template_history`  (
  `f_id` bigint NOT NULL COMMENT '主键 (雪花算法或分布式ID)',
  `template_id` bigint NOT NULL COMMENT '检验模板ID',
  `version` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '版本号',
  `change_summary` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '变更摘要',
  `snapshot_data` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL COMMENT '快照数据 (JSON格式存储模板完整数据)',
  `f_creator_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `f_creator_user_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '创建用户ID',
  PRIMARY KEY (`f_id`) USING BTREE,
  INDEX `idx_template_id`(`template_id` ASC) USING BTREE,
  INDEX `idx_version`(`template_id` ASC, `version` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '检验模板版本历史' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for qm_md_insp_tpl_detail_phenomenon
-- ----------------------------
DROP TABLE IF EXISTS `qm_md_insp_tpl_detail_phenomenon`;
CREATE TABLE `qm_md_insp_tpl_detail_phenomenon`  (
  `f_id` bigint NOT NULL COMMENT '主键 (雪花算法或分布式ID)',
  `detail_id` bigint NOT NULL COMMENT '检验模板明细ID',
  `phenomenon_id` bigint NOT NULL COMMENT '不良现象ID (关联qm_md_defect_phenomenon)',
  `f_tenant_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '0' COMMENT '租户ID',
  PRIMARY KEY (`f_id`) USING BTREE,
  UNIQUE INDEX `uk_detail_phenomenon`(`detail_id` ASC, `phenomenon_id` ASC) USING BTREE,
  INDEX `idx_detail_id`(`detail_id` ASC) USING BTREE,
  INDEX `idx_phenomenon_id`(`phenomenon_id` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '检验模板明细-不良现象关联' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for qm_md_inspection_template
-- ----------------------------
DROP TABLE IF EXISTS `qm_md_inspection_template`;
CREATE TABLE `qm_md_inspection_template`  (
  `f_id` bigint NOT NULL COMMENT '主键 (雪花算法或分布式ID)',
  `org_id` bigint NULL DEFAULT NULL COMMENT '组织ID (NULL表示集团级模板)',
  `code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '模板编码',
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '模板名称',
  `insp_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '检验类型 (IQC/IPQC/FQC/OQC)',
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'DRAFT' COMMENT '状态 (DRAFT-草稿/IN_APPROVAL-审批中/APPROVED-已批准/OBSOLETE-已作废)',
  `version` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'V1.0' COMMENT '版本号',
  `detail_count` int NULL DEFAULT 0 COMMENT '关联检验项数量',
  `f_flow_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '流程定义ID',
  `f_flow_task_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '流程任务ID',
  `f_flow_state` int NULL DEFAULT NULL COMMENT '流程状态',
  `f_tenant_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '0' COMMENT '租户ID',
  `f_enabled_mark` int NOT NULL DEFAULT 1 COMMENT '有效标志 (1-启用, 0-禁用)',
  `f_delete_mark` int NOT NULL DEFAULT 0 COMMENT '删除标志 (1-已删除, 0-未删除)',
  `f_sort_code` bigint NULL DEFAULT NULL COMMENT '排序码',
  `f_description` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '备注描述',
  `f_creator_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `f_creator_user_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '创建用户ID',
  `f_last_modify_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '修改时间',
  `f_last_modify_user_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '修改用户ID',
  `f_delete_user_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '删除用户ID',
  `f_delete_time` datetime NULL DEFAULT NULL COMMENT '删除时间',
  PRIMARY KEY (`f_id`) USING BTREE,
  UNIQUE INDEX `uk_org_code`(`org_id` ASC, `code` ASC, `f_tenant_id` ASC) USING BTREE,
  INDEX `idx_insp_type`(`insp_type` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE,
  INDEX `idx_tenant_delete`(`f_tenant_id` ASC, `f_delete_mark` ASC) USING BTREE,
  INDEX `idx_flow_task_id`(`f_flow_task_id` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '检验模板主数据' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for qm_md_measure_info
-- ----------------------------
DROP TABLE IF EXISTS `qm_md_measure_info`;
CREATE TABLE `qm_md_measure_info`  (
  `f_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '主键（自然主键，如 UUID 或业务编码）',
  `measure_type_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '量检具类型ID',
  `measure_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '量具编号',
  `measure_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '量具名称',
  `specification` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '规格型号',
  `manufacturer` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '制造商',
  `measure_range` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '量程范围',
  `resolution` decimal(8, 4) NULL DEFAULT 0.0100 COMMENT '分辨率',
  `keeper` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '保管人',
  `storage_location` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '存放位置',
  `status` int NOT NULL DEFAULT 1 COMMENT '状态 1:在用, 2:校准中 ,3:停用, 4:报废',
  `next_calibration_date` date NULL DEFAULT NULL COMMENT '下次校准日期',
  `purchase_date` date NULL DEFAULT NULL COMMENT '购置日期',
  `f_tenant_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '0' COMMENT '租户id',
  `f_enabled_mark` int NOT NULL DEFAULT 1 COMMENT '有效标志（1-启用, 0-禁用）',
  `f_delete_mark` int NOT NULL DEFAULT 0 COMMENT '删除标志（1-已删除, 0-未删除）',
  `f_description` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '描述',
  `f_sort_code` bigint NULL DEFAULT NULL COMMENT '排序码',
  `f_creator_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `f_creator_user_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '创建用户',
  `f_last_modify_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '修改时间',
  `f_last_modify_user_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '修改用户',
  `f_delete_user_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '删除用户',
  `f_delete_time` datetime NULL DEFAULT CURRENT_TIMESTAMP COMMENT '删除时间',
  PRIMARY KEY (`f_id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '量检具台账' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for qm_md_measure_type
-- ----------------------------
DROP TABLE IF EXISTS `qm_md_measure_type`;
CREATE TABLE `qm_md_measure_type`  (
  `f_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '主键（自然主键，如 UUID 或业务编码）',
  `org_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '组织ID；NULL 表示集团通用量具类型',
  `f_parent_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '上级',
  `type_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '类型名称，需在组织内唯一',
  `measure_precision` decimal(10, 6) NOT NULL COMMENT '精度/分辨率（单位：mm 或其他，由业务约定）',
  `is_msa_required` tinyint(1) NOT NULL DEFAULT 1 COMMENT '是否需 MSA（1-是, 0-否）',
  `f_tenant_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '0' COMMENT '租户id',
  `f_enabled_mark` int NOT NULL DEFAULT 1 COMMENT '有效标志（1-启用, 0-禁用）',
  `f_delete_mark` int NOT NULL DEFAULT 0 COMMENT '删除标志（1-已删除, 0-未删除）',
  `f_description` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '描述',
  `f_sort_code` bigint NULL DEFAULT NULL COMMENT '排序码',
  `f_creator_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `f_creator_user_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '创建用户',
  `f_last_modify_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '修改时间',
  `f_last_modify_user_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '修改用户',
  `f_delete_user_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '删除用户',
  `f_delete_time` datetime NULL DEFAULT CURRENT_TIMESTAMP COMMENT '删除时间',
  PRIMARY KEY (`f_id`) USING BTREE,
  UNIQUE INDEX `uk_org_type_name`(`org_id` ASC, `type_name` ASC) USING BTREE,
  INDEX `idx_org_id`(`org_id` ASC) USING BTREE,
  INDEX `idx_type_name`(`type_name` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '量检具类型库（定义量具类别要求）' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for qm_md_rel_cause_fmea
-- ----------------------------
DROP TABLE IF EXISTS `qm_md_rel_cause_fmea`;
CREATE TABLE `qm_md_rel_cause_fmea`  (
  `f_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '自然主键',
  `org_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '组织ID',
  `cause_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '外键 -> DefectCause',
  `fmea_failure_mode_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT 'FMEA失效模式ID（来自外部FMEA系统或模块）',
  PRIMARY KEY (`f_id`) USING BTREE,
  INDEX `idx_cause_id`(`cause_id` ASC) USING BTREE,
  INDEX `idx_fmea_failure_mode_id`(`fmea_failure_mode_id` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '不良原因与FMEA关联表（多对多映射）' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for qm_md_rel_inspitem_phenomenon
-- ----------------------------
DROP TABLE IF EXISTS `qm_md_rel_inspitem_phenomenon`;
CREATE TABLE `qm_md_rel_inspitem_phenomenon`  (
  `f_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '主键（建议 UUID 或自增编码字符串）',
  `org_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '组织ID',
  `insp_item_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '检验项目标准库ID，关联 qm_md_insp_item.f_id',
  `phenomenon_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '关联不良现象表（qm_md_defect_phenomenon.f_id）',
  PRIMARY KEY (`f_id`) USING BTREE,
  INDEX `idx_plan_detail_id`(`insp_item_id` ASC) USING BTREE,
  INDEX `idx_phenomenon_id`(`phenomenon_id` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '检验项目与不良现象关系表（多对多）' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for qm_md_rel_phenomenon_cause_knowledge
-- ----------------------------
DROP TABLE IF EXISTS `qm_md_rel_phenomenon_cause_knowledge`;
CREATE TABLE `qm_md_rel_phenomenon_cause_knowledge`  (
  `f_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '自然主键',
  `phenomenon_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '关联不良现象表（QM_MD_DEFECT_PHENOMENON.f_id）',
  `org_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '组织ID',
  `cause_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '关联不良原因表（QM_MD_DEFECT_CAUSE.f_id）',
  `weight` int NOT NULL DEFAULT 1 COMMENT '权重/发生频率（值越大越常见，用于排序推荐）',
  `f_tenant_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '0' COMMENT '租户id',
  PRIMARY KEY (`f_id`) USING BTREE,
  INDEX `idx_phenomenon_id`(`phenomenon_id` ASC) USING BTREE,
  INDEX `idx_cause_id`(`cause_id` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '现象-原因关联知识库（用于智能辅助推荐）' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for qm_md_sampling_plan
-- ----------------------------
DROP TABLE IF EXISTS `qm_md_sampling_plan`;
CREATE TABLE `qm_md_sampling_plan`  (
  `f_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '主键 (雪花算法或分布式ID)',
  `org_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '组织ID (NULL表示集团级方案)',
  `plan_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '方案代码 (唯一标识)',
  `plan_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '方案名称',
  `sampling_method` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '抽样方法 (FIXED_QUANTITY, PERCENTAGE, STANDARD_BASED, FULL_INSPECTION)',
  `standard_ref` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '引用标准 (如 GB/T 2828.1-2012)',
  `f_tenant_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '0' COMMENT '租户ID',
  `f_enabled_mark` int NOT NULL DEFAULT 1 COMMENT '有效标志 (1-启用, 0-禁用)',
  `f_delete_mark` int NOT NULL DEFAULT 0 COMMENT '删除标志 (1-已删除, 0-未删除)',
  `f_sort_code` bigint NULL DEFAULT NULL COMMENT '排序码',
  `f_description` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '备注描述',
  `f_creator_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `f_creator_user_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '创建用户ID',
  `f_last_modify_time` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '修改时间',
  `f_last_modify_user_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '修改用户ID',
  `f_delete_user_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '删除用户ID',
  `f_delete_time` datetime NULL DEFAULT NULL COMMENT '删除时间',
  PRIMARY KEY (`f_id`) USING BTREE,
  UNIQUE INDEX `uk_org_plan_code`(`org_id` ASC, `plan_code` ASC, `f_tenant_id` ASC) USING BTREE,
  INDEX `idx_sampling_method`(`sampling_method` ASC) USING BTREE,
  INDEX `idx_tenant_delete`(`f_tenant_id` ASC, `f_delete_mark` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '抽样方案主数据' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for qm_md_sampling_rule
-- ----------------------------
DROP TABLE IF EXISTS `qm_md_sampling_rule`;
CREATE TABLE `qm_md_sampling_rule`  (
  `f_id` bigint NOT NULL COMMENT '主键 (雪花算法或分布式ID)',
  `org_id` bigint NULL DEFAULT NULL COMMENT '组织ID (NULL表示集团级规则)',
  `plan_id` bigint NOT NULL COMMENT '关联抽样方案ID (qm_md_sampling_plan.f_id)',
  `rule_code` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '规则代码 (唯一标识，如 AQL-GB2828-L2-N-0.65)',
  `rule_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '规则名称 (如 II级正常单次AQL=0.65)',
  `inspection_level` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '检验水平 (I, II, III, S-1, S-2, S-3, S-4)',
  `inspection_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '严格类型 (NORMAL-正常, STRICT-加严, REDUCED-放宽)',
  `aql_value` decimal(10, 4) NULL DEFAULT NULL COMMENT '接收质量限 (AQL值)',
  `sample_size_rate` int NULL DEFAULT NULL COMMENT '样本量比率 (0-100，当方法为PERCENTAGE时有效)',
  `sample_size` int NULL DEFAULT NULL COMMENT '固定样本量 (当方法为FIXED_QUANTITY时有效)',
  `f_tenant_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '0' COMMENT '租户ID',
  `f_enabled_mark` int NOT NULL DEFAULT 1 COMMENT '有效标志 (1-启用, 0-禁用)',
  `f_delete_mark` int NOT NULL DEFAULT 0 COMMENT '删除标志 (1-已删除, 0-未删除)',
  `f_sort_code` bigint NULL DEFAULT NULL COMMENT '排序码',
  `f_description` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '备注描述',
  `f_creator_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `f_creator_user_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '创建用户ID',
  `f_last_modify_time` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '修改时间',
  `f_last_modify_user_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '修改用户ID',
  `f_delete_user_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '删除用户ID',
  `f_delete_time` datetime NULL DEFAULT NULL COMMENT '删除时间',
  PRIMARY KEY (`f_id`) USING BTREE,
  UNIQUE INDEX `uk_org_rule_code`(`org_id` ASC, `rule_code` ASC, `f_tenant_id` ASC) USING BTREE,
  INDEX `idx_plan_id`(`plan_id` ASC) USING BTREE,
  INDEX `idx_inspection_type`(`inspection_type` ASC) USING BTREE,
  INDEX `idx_tenant_delete`(`f_tenant_id` ASC, `f_delete_mark` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '抽样规则明细表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for qm_md_sampling_rule_detail
-- ----------------------------
DROP TABLE IF EXISTS `qm_md_sampling_rule_detail`;
CREATE TABLE `qm_md_sampling_rule_detail`  (
  `f_id` bigint NOT NULL COMMENT '主键 (雪花算法或分布式ID)',
  `rule_id` bigint NOT NULL COMMENT '关联抽样规则ID (qm_md_sampling_rule.f_id)',
  `batch_size_min` int NOT NULL COMMENT '批量范围下限 (从)',
  `batch_size_max` int NULL DEFAULT NULL COMMENT '批量范围上限 (至)，NULL表示无上限',
  `sample_size_code` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '样本量字码 (如 A, B, ... G)',
  `sample_size` int NULL DEFAULT NULL COMMENT '应抽取样本量 (运行时计算结果或预定义值)',
  `acceptance_number` int NOT NULL COMMENT '接收数 (Ac)',
  `rejection_number` int NOT NULL COMMENT '拒收数 (Re)',
  `f_tenant_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '0' COMMENT '租户ID',
  `f_enabled_mark` int NOT NULL DEFAULT 1 COMMENT '有效标志 (1-启用, 0-禁用)',
  `f_delete_mark` int NOT NULL DEFAULT 0 COMMENT '删除标志 (1-已删除, 0-未删除)',
  `f_sort_code` bigint NULL DEFAULT NULL COMMENT '排序码 (可用于控制区间显示顺序)',
  `f_description` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '备注描述',
  `f_creator_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `f_creator_user_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '创建用户ID',
  `f_last_modify_time` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '修改时间',
  `f_last_modify_user_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '修改用户ID',
  `f_delete_user_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '删除用户ID',
  `f_delete_time` datetime NULL DEFAULT NULL COMMENT '删除时间',
  PRIMARY KEY (`f_id`) USING BTREE,
  UNIQUE INDEX `uk_rule_batch_min`(`rule_id` ASC, `batch_size_min` ASC, `f_tenant_id` ASC) USING BTREE,
  INDEX `idx_rule_batch_range`(`rule_id` ASC, `batch_size_min` ASC, `batch_size_max` ASC) USING BTREE,
  INDEX `idx_tenant_delete`(`f_tenant_id` ASC, `f_delete_mark` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '抽样规则明细表 (抽样矩阵)' ROW_FORMAT = Dynamic;

SET FOREIGN_KEY_CHECKS = 1;
