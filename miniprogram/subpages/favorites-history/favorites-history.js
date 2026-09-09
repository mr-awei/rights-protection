// subsubsubpages/favorites-history/favorites-history.js
const app = getApp();
const { getChannelById, getScriptById } = require('../../utils/data');

const PAGE_SIZE = 10; // 每页加载10条

Page({
  data: {
    activeTab: 'channels', // channels: 收藏渠道, scripts: 收藏话术, history: 浏览历史
    statusBarHeight: 0,
    // 列表数据
    channelList: [],
    scriptList: [],
    historyList: [],
    // 收藏分组
    groups: [],
    activeGroup: 'all', // all: 全部, 其他为分组ID
    // 分页状态
    channelPage: 1,
    scriptPage: 1,
    historyPage: 1,
    channelHasMore: true,
    scriptHasMore: true,
    historyHasMore: true,
    // 加载状态
    loading: false,
    // 总数
    channelTotal: 0,
    scriptTotal: 0,
    historyTotal: 0,
    // 批量管理模式
    isBatchMode: false,
    selectedItems: [],
    isAllSelected: false,
    // 自定义弹窗状态
    modalVisible: false,
    modalType: 'confirm',
    modalTitle: '',
    modalContent: '',
    modalConfirmText: '确定',
    modalCancelText: '取消',
    modalShowCancel: true,
    modalPlaceholder: '',
    modalDefaultValue: '',
    modalItemList: [],
    modalCallback: null
  },

  onLoad(options) {
    // 动态获取状态栏高度
    try {
      const systemInfo = wx.getSystemInfoSync();
      this.setData({ statusBarHeight: systemInfo.statusBarHeight || 20 });
    } catch (e) {
      this.setData({ statusBarHeight: 20 });
    }

    // 从参数中获取初始Tab
    if (options.tab) {
      this.setData({ activeTab: options.tab });
    }

    this.loadAllData();

  },

  onShow() {
    // 页面显示时刷新数据（可能从详情页返回收藏状态变化）
    this.refreshCurrentTab();

  },

  // 加载所有数据的总数
  loadAllData() {
    const favoritesData = app.globalData.favorites || {};
    const favorites = { channels: favoritesData.channels || [], scripts: favoritesData.scripts || [] };
    const viewHistory = app.getViewHistory() || [];
    const groups = app.getFavoriteGroups() || [];

    this.setData({
      channelTotal: favorites.channels.length,
      scriptTotal: favorites.scripts.length,
      historyTotal: viewHistory.length,
      groups: groups
    });

    // 加载当前Tab的第一页
    this.loadCurrentTab(1);
  },

  // 刷新当前Tab
  refreshCurrentTab() {
    const favoritesData = app.globalData.favorites || {};
    const favorites = { channels: favoritesData.channels || [], scripts: favoritesData.scripts || [] };
    const viewHistory = app.getViewHistory() || [];
    const groups = app.getFavoriteGroups() || [];

    this.setData({
      channelTotal: favorites.channels.length,
      scriptTotal: favorites.scripts.length,
      historyTotal: viewHistory.length,
      groups: groups
    });

    this.loadCurrentTab(1);
  },

  // 切换分组
  onGroupTap(e) {
    const groupId = e.currentTarget.dataset.group;
    this.setData({ activeGroup: groupId });
    this.loadCurrentTab(1);
  },

  // ========== 自定义弹窗通用方法 ==========
  showConfirmModal(options) {
    this.setData({
      modalVisible: true,
      modalType: 'confirm',
      modalTitle: options.title || '提示',
      modalContent: options.content || '',
      modalConfirmText: options.confirmText || '确定',
      modalCancelText: options.cancelText || '取消',
      modalShowCancel: options.showCancel !== false,
      modalCallback: options.success || null
    });
  },

  showInputModal(options) {
    this.setData({
      modalVisible: true,
      modalType: 'input',
      modalTitle: options.title || '请输入',
      modalPlaceholder: options.placeholder || '请输入',
      modalDefaultValue: options.defaultValue || '',
      modalConfirmText: options.confirmText || '确定',
      modalCancelText: options.cancelText || '取消',
      modalCallback: options.success || null
    });
  },

  showActionSheetModal(options) {
    this.setData({
      modalVisible: true,
      modalType: 'actionSheet',
      modalItemList: options.itemList || [],
      modalCallback: options.success || null
    });
  },

  onModalConfirm(e) {
    const callback = this.data.modalCallback;
    this.setData({ modalVisible: false, modalCallback: null });
    if (callback) {
      if (this.data.modalType === 'input') {
        callback({ confirm: true, content: e.detail.value });
      } else {
        callback({ confirm: true });
      }
    }
  },

  onModalCancel() {
    const callback = this.data.modalCallback;
    this.setData({ modalVisible: false, modalCallback: null });
    if (callback && this.data.modalType !== 'actionSheet') {
      callback({ cancel: true });
    }
  },

  onModalSelect(e) {
    const callback = this.data.modalCallback;
    this.setData({ modalVisible: false, modalCallback: null });
    if (callback) {
      callback({ tapIndex: e.detail.index });
    }
  },

  // 创建新分组
  onCreateGroup() {
    this.showInputModal({
      title: '新建分组',
      placeholder: '请输入分组名称',
      success: (res) => {
        if (res.confirm && res.content) {
          const groupId = app.createFavoriteGroup(res.content);
          if (groupId) {
            const groups = app.getFavoriteGroups() || [];
            this.setData({
              groups: groups,
              activeGroup: groupId
            });
            this.loadCurrentTab(1);
            wx.showToast({ title: '分组已创建', icon: 'success' });
          }
        }
      }
    });
  },

  // 加载当前Tab的数据
  loadCurrentTab(page) {
    const tab = this.data.activeTab;
    if (tab === 'channels') {
      this.loadChannels(page);
    } else if (tab === 'scripts') {
      this.loadScripts(page);
    } else if (tab === 'history') {
      this.loadHistory(page);
    }
  },

  // 加载收藏渠道
  loadChannels(page) {
    if (this.data.loading) return;
    this.setData({ loading: true });

    const allIds = app.globalData.favorites.channels || [];
    const start = (page - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    const pageIds = allIds.slice(start, end);

    const list = pageIds.map(id => {
      try {
        return getChannelById(id) || { id, name: '未知渠道', category: '已删除' };
      } catch (e) {
        return { id, name: '未知渠道', category: '已删除' };
      }
    });

    const newList = page === 1 ? list : [...this.data.channelList, ...list];

    this.setData({
      channelList: newList,
      channelPage: page,
      channelHasMore: end < allIds.length,
      loading: false
    });
  },

  // 加载收藏话术
  loadScripts(page) {
    if (this.data.loading) return;
    this.setData({ loading: true });

    const allIds = app.globalData.favorites.scripts || [];
    const start = (page - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    const pageIds = allIds.slice(start, end);

    const list = pageIds.map(id => {
      try {
        return getScriptById(id) || { id, name: '未知话术', applicable: '已删除' };
      } catch (e) {
        return { id, name: '未知话术', applicable: '已删除' };
      }
    });

    const newList = page === 1 ? list : [...this.data.scriptList, ...list];

    this.setData({
      scriptList: newList,
      scriptPage: page,
      scriptHasMore: end < allIds.length,
      loading: false
    });
  },

  // 加载浏览历史
  loadHistory(page) {
    if (this.data.loading) return;
    this.setData({ loading: true });

    const allHistory = app.getViewHistory() || [];
    const start = (page - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    const pageList = allHistory.slice(start, end).map(item => {
      const typeLabel = item.item_type === 'channel' ? '渠道' : '话术';
      const typeColor = item.item_type === 'channel' ? '#3B82F6' : '#10B981';
      // 格式化时间
      let timeStr = '';
      if (item.viewed_at) {
        const date = new Date(item.viewed_at);
        timeStr = `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
      }
      return {
        ...item,
        typeLabel,
        typeColor,
        timeStr
      };
    });

    const newList = page === 1 ? pageList : [...this.data.historyList, ...pageList];

    this.setData({
      historyList: newList,
      historyPage: page,
      historyHasMore: end < allHistory.length,
      loading: false
    });
  },

  // Tab切换
  onTabTap(e) {
    const tab = e.currentTarget.dataset.tab;
    if (tab === this.data.activeTab) return;

    this.setData({ activeTab: tab });
    this.loadCurrentTab(1);
  },

  // 点击收藏渠道
  onChannelTap(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/channel-detail/channel-detail?id=${id}`
    });
  },

  // 点击收藏话术
  onScriptTap(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/script-detail/script-detail?id=${id}`
    });
  },

  // 点击浏览历史
  onHistoryTap(e) {
    const item = e.currentTarget.dataset.item;
    if (item.item_type === 'channel') {
      wx.navigateTo({
        url: `/pages/channel-detail/channel-detail?id=${item.item_id}`
      });
    } else if (item.item_type === 'script') {
      wx.navigateTo({
        url: `/pages/script-detail/script-detail?id=${item.item_id}`
      });
    }
  },

  // 取消收藏渠道
  onRemoveChannel(e) {
    const id = e.currentTarget.dataset.id;
    this.showConfirmModal({
      title: '取消收藏',
      content: '确定要取消收藏这个渠道吗？',
      confirmText: '取消收藏',
      cancelText: '再想想',
      success: (res) => {
        if (res.confirm) {
          app.removeFavorite('channels', id);
          wx.showToast({ title: '已取消收藏', icon: 'success' });
          this.refreshCurrentTab();
        }
      }
    });
  },

  // 取消收藏话术
  onRemoveScript(e) {
    const id = e.currentTarget.dataset.id;
    this.showConfirmModal({
      title: '取消收藏',
      content: '确定要取消收藏这个话术吗？',
      confirmText: '取消收藏',
      cancelText: '再想想',
      success: (res) => {
        if (res.confirm) {
          app.removeFavorite('scripts', id);
          wx.showToast({ title: '已取消收藏', icon: 'success' });
          this.refreshCurrentTab();
        }
      }
    });
  },

  // 清空浏览历史
  onClearHistory() {
    this.showConfirmModal({
      title: '清空历史',
      content: '确定要清空所有浏览历史吗？此操作不可恢复。',
      confirmText: '清空',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          app.clearViewHistory();
          wx.showToast({ title: '已清空历史', icon: 'success' });
          this.refreshCurrentTab();
        }
      }
    });
  },

  // 删除单条浏览历史
  onRemoveHistory(e) {
    const item = e.currentTarget.dataset.item;
    if (!item) return;
    this.showConfirmModal({
      title: '删除记录',
      content: '确定要删除这条浏览记录吗？',
      confirmText: '删除',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          app.removeViewHistory(item.item_type, item.item_id);
          wx.showToast({ title: '已删除', icon: 'success' });
          this.refreshCurrentTab();
        }
      }
    });
  },

  // 左滑手势检测 - 开始
  onTouchStart(e) {
    if (this.data.isBatchMode) return;
    const touch = e.touches[0];
    this._touchStartX = touch.clientX;
    this._touchStartY = touch.clientY;
    this._touchStartTime = Date.now();
  },

  // 左滑手势检测 - 结束
  onTouchEnd(e) {
    if (this.data.isBatchMode) return;
    if (!this._touchStartX) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - this._touchStartX;
    const deltaY = touch.clientY - this._touchStartY;
    const deltaTime = Date.now() - this._touchStartTime;

    // 左滑判断：横向滑动距离>50px，纵向距离<30px，时间<500ms
    if (deltaX < -50 && Math.abs(deltaY) < 30 && deltaTime < 500) {
      const tab = this.data.activeTab;
      const dataset = e.currentTarget.dataset;

      if (tab === 'channels' && dataset.id) {
        this.onRemoveChannel({ currentTarget: { dataset: { id: dataset.id } } });
      } else if (tab === 'scripts' && dataset.id) {
        this.onRemoveScript({ currentTarget: { dataset: { id: dataset.id } } });
      } else if (tab === 'history' && dataset.item) {
        this.onRemoveHistory({ currentTarget: { dataset: { item: dataset.item } } });
      }
    }

    this._touchStartX = null;
    this._touchStartY = null;
    this._touchStartTime = null;
  },

  // 滚动到底部加载更多
  onReachBottom() {
    const tab = this.data.activeTab;
    let hasMore = false;
    let nextPage = 1;

    if (tab === 'channels') {
      hasMore = this.data.channelHasMore;
      nextPage = this.data.channelPage + 1;
    } else if (tab === 'scripts') {
      hasMore = this.data.scriptHasMore;
      nextPage = this.data.scriptPage + 1;
    } else if (tab === 'history') {
      hasMore = this.data.historyHasMore;
      nextPage = this.data.historyPage + 1;
    }

    if (hasMore && !this.data.loading) {
      this.loadCurrentTab(nextPage);
    }
  },

  // ========== 分组管理（长按重命名/删除/排序）==========

  // 长按分组显示操作菜单
  onGroupLongPress(e) {
    const groupId = e.currentTarget.dataset.group;
    const groupIndex = e.currentTarget.dataset.index;
    const group = this.data.groups.find(g => g.id === groupId);
    if (!group) return;
    if (group.type === 'system') {
      wx.showToast({ title: '默认分组不可操作', icon: 'none' });
      return;
    }

    const itemList = ['重命名', '上移', '下移', '删除分组'];
    this.showActionSheetModal({
      itemList: itemList,
      success: (res) => {
        const action = itemList[res.tapIndex];
        if (action === '重命名') {
          this.onRenameGroup(groupId, group.name);
        } else if (action === '上移') {
          this.onMoveGroup(groupId, 'up');
        } else if (action === '下移') {
          this.onMoveGroup(groupId, 'down');
        } else if (action === '删除分组') {
          this.onDeleteGroup(groupId, group.name);
        }
      }
    });
  },

  // 重命名分组
  onRenameGroup(groupId, oldName) {
    this.showInputModal({
      title: '重命名分组',
      placeholder: '请输入新名称',
      defaultValue: oldName,
      success: (res) => {
        if (res.confirm && res.content && res.content.trim()) {
          if (app.renameFavoriteGroup(groupId, res.content.trim())) {
            const groups = app.getFavoriteGroups();
            this.setData({ groups });
            wx.showToast({ title: '已重命名', icon: 'success' });
          }
        }
      }
    });
  },

  // 移动分组排序
  onMoveGroup(groupId, direction) {
    if (app.moveFavoriteGroup(groupId, direction)) {
      const groups = app.getFavoriteGroups();
      this.setData({ groups });
      wx.showToast({ title: direction === 'up' ? '已上移' : '已下移', icon: 'success' });
    } else {
      wx.showToast({ title: '无法移动', icon: 'none' });
    }
  },

  // 删除分组
  onDeleteGroup(groupId, groupName) {
    this.showConfirmModal({
      title: '删除分组',
      content: `确定要删除分组"${groupName}"吗？分组内的收藏不会被删除。`,
      confirmText: '删除',
      success: (res) => {
        if (res.confirm) {
          if (app.deleteFavoriteGroup(groupId)) {
            const groups = app.getFavoriteGroups();
            this.setData({ groups, activeGroup: 'all' });
            this.loadCurrentTab(1);
            wx.showToast({ title: '已删除', icon: 'success' });
          }
        }
      }
    });
  },

  // ========== 批量管理模式 ==========

  // 切换批量管理模式
  onToggleBatchMode() {
    const isBatchMode = !this.data.isBatchMode;
    this.setData({
      isBatchMode,
      selectedItems: [],
      isAllSelected: false
    });
  },

  // 切换选择项
  onToggleSelect(e) {
    const id = e.currentTarget.dataset.id;
    const tab = this.data.activeTab;
    const itemKey = tab + ':' + id;
    const selectedItems = [...this.data.selectedItems];
    const index = selectedItems.indexOf(itemKey);

    if (index > -1) {
      selectedItems.splice(index, 1);
    } else {
      selectedItems.push(itemKey);
    }

    // 计算是否全选
    const currentList = tab === 'channels' ? this.data.channelList : this.data.scriptList;
    const isAllSelected = selectedItems.length === currentList.length && currentList.length > 0;

    this.setData({ selectedItems, isAllSelected });
  },

  // 全选/取消全选
  onSelectAll() {
    const tab = this.data.activeTab;
    const currentList = tab === 'channels' ? this.data.channelList : this.data.scriptList;

    if (this.data.isAllSelected) {
      this.setData({ selectedItems: [], isAllSelected: false });
    } else {
      const selectedItems = currentList.map(item => tab + ':' + item.id);
      this.setData({ selectedItems, isAllSelected: true });
    }
  },

  // 批量移动到分组
  onMoveToGroup() {
    const selectedItems = this.data.selectedItems;
    if (selectedItems.length === 0) {
      wx.showToast({ title: '请先选择项目', icon: 'none' });
      return;
    }

    const groups = this.data.groups.filter(g => g.type !== 'system' || g.id === 'default');
    const groupNames = groups.map(g => g.name);

    this.showActionSheetModal({
      itemList: groupNames,
      success: (res) => {
        const targetGroup = groups[res.tapIndex];
        if (app.moveFavoriteItemsToGroup(selectedItems, targetGroup.id)) {
          wx.showToast({ title: `已移动${selectedItems.length}项`, icon: 'success' });
          this.setData({ selectedItems: [], isAllSelected: false, isBatchMode: false });
          this.refreshCurrentTab();
        }
      }
    });
  },

  // 批量删除
  onBatchRemove() {
    const selectedItems = this.data.selectedItems;
    if (selectedItems.length === 0) {
      wx.showToast({ title: '请先选择项目', icon: 'none' });
      return;
    }

    this.showConfirmModal({
      title: '批量删除',
      content: `确定要删除选中的${selectedItems.length}项收藏吗？`,
      confirmText: '删除',
      success: (res) => {
        if (res.confirm) {
          const tab = this.data.activeTab;
          selectedItems.forEach(itemKey => {
            const [type, id] = itemKey.split(':');
            if (type === 'channel') {
              app.removeFavorite('channels', id);
            } else if (type === 'script') {
              app.removeFavorite('scripts', id);
            }
          });
          // 从所有分组中移除
          app.removeFavoriteItemsFromGroups(selectedItems);

          wx.showToast({ title: `已删除${selectedItems.length}项`, icon: 'success' });
          this.setData({ selectedItems: [], isAllSelected: false, isBatchMode: false });
          this.refreshCurrentTab();
        }
      }
    });
  },

  // 返回
  onBack() {
    wx.navigateBack({
      fail: () => {
        wx.switchTab({ url: '/pages/profile/profile' });
      }
    });
  },
});