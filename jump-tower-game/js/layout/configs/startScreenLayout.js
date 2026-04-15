module.exports = {
  id: 'startScreen',
  vars: {
    iconSize: 60,
    bottomBarHeight: 105
  },
  elements: [
    {
      id: 'title',
      type: 'text',
      anchor: { x: 'center', y: 'center' },
      offset: { x: 0, y: -120 },
      size: { width: 200, height: 40 },
      style: {
        color: '#ffdd57',
        fontSize: 36,
        fontWeight: 'bold',
        textAlign: 'center',
        shadow: { color: '#ffaa00', blur: 20 }
      },
      textKey: 'GAME_TITLE'
    },
    {
      id: 'subtitle',
      type: 'text',
      anchor: { x: 'center', y: 'center' },
      offset: { x: 0, y: -80 },
      size: { width: 300, height: 30 },
      style: {
        color: '#ff6b6b',
        fontSize: 20,
        textAlign: 'center'
      },
      textKey: 'SUBTITLE'
    },
    {
      id: 'hint',
      type: 'text',
      anchor: { x: 'center', y: 'center' },
      offset: { x: 0, y: -50 },
      size: { width: 300, height: 24 },
      style: {
        color: '#74b9ff',
        fontSize: 16,
        textAlign: 'center'
      },
      textKey: 'HINT'
    },
    {
      id: 'startBtn',
      type: 'button',
      anchor: { x: 'center', y: 'center' },
      offset: { x: 0, y: 200 },
      size: { width: 140, height: 50 },
      style: {
        bgColor: '#00d084',
        borderRadius: 25,
        textColor: '#ffffff',
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        shadow: { color: '#00d084', blur: 15 }
      },
      textKey: 'START_BUTTON',
      action: { type: 'start-game', mode: 'endless' },
      visibleWhen: '!panelManager.isAnyOpen()'
    },
    {
      id: 'bottomBar',
      type: 'flex',
      anchor: { x: 'center', y: 'bottom' },
      offset: { x: 0, y: -100 },
      flex: {
        direction: 'row',
        gap: 4,
        justify: 'center',
        align: 'center'
      },
      size: { width: '100%', height: 100 },
      children: [
        {
          id: 'shop',
          type: 'iconButton',
          size: { width: 60, height: 60 },
          textKey: 'NAV_SHOP',
          imageKey: 'iconShop',
          action: { type: 'open-panel', panel: 'showShopPanel' }
        },
        {
          id: 'character',
          type: 'iconButton',
          size: { width: 60, height: 60 },
          textKey: 'NAV_CHARACTER',
          imageKey: 'iconCharacter',
          action: { type: 'open-panel', panel: 'showCharacterPanel' }
        },
        {
          id: 'mode',
          type: 'iconButton',
          size: { width: 60, height: 60 },
          textKey: 'NAV_MODE',
          imageKey: 'iconMode',
          action: { type: 'open-panel', panel: 'showModeSelect' }
        },
        {
          id: 'achievement',
          type: 'iconButton',
          size: { width: 60, height: 60 },
          textKey: 'NAV_ACHIEVEMENT',
          imageKey: 'iconAchievement',
          action: { type: 'open-panel', panel: 'showAchievementPanel' }
        },
        {
          id: 'leaderboard',
          type: 'iconButton',
          size: { width: 60, height: 60 },
          textKey: 'NAV_LEADERBOARD',
          imageKey: 'iconLeaderboard',
          action: { type: 'open-panel', panel: 'showLeaderboardPanel' }
        },
        {
          id: 'pet',
          type: 'iconButton',
          size: { width: 60, height: 60 },
          textKey: 'NAV_PET',
          imageKey: 'iconPet',
          action: { type: 'open-panel', panel: 'showPetPanel' }
        },
        {
          id: 'backpack',
          type: 'iconButton',
          size: { width: 60, height: 60 },
          textKey: 'NAV_BACKPACK',
          imageKey: 'iconBackpack',
          action: { type: 'open-panel', panel: 'showBackpackPanel' }
        }
      ]
    }
  ]
};
