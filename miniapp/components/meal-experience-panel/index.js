Component({
  properties: {
    mode: { type: String, value: 'list' },
    ideas: { type: Array, value: [] },
    rows: { type: Array, value: [] },
    status: { type: String, value: 'idle' },
    errorText: { type: String, value: '' },
    scenes: { type: Array, value: [] },
    activeScene: { type: String, value: '全部' },
    canShuffle: { type: Boolean, value: false },
    selectedIdea: { type: Object, value: null },
    videoStatus: { type: String, value: 'idle' },
    videoSrc: { type: String, value: '' },
    videoCover: { type: String, value: '' },
    videoErrorText: { type: String, value: '' },
    cartCount: { type: Number, value: 0 },
    motionReduced: { type: Boolean, value: false }
  },
  methods: {
    handleSelectScene(event) { this.triggerEvent('selectscene', { scene: event.currentTarget.dataset.scene }); },
    handleShuffle() { this.triggerEvent('shuffle'); },
    handleOpenIdea(event) { this.triggerEvent('openidea', { id: event.currentTarget.dataset.id }); },
    handleRetryCollection() { this.triggerEvent('retrycollection'); },
    handleBack() { this.triggerEvent('back'); },
    handleRetryVideo() { this.triggerEvent('retryvideo'); },
    handlePlayVideo() {
      if (!this.data.videoSrc || !['ready', 'paused'].includes(this.data.videoStatus)) return;
      if (typeof wx === 'undefined' || typeof wx.createVideoContext !== 'function') return;
      const videoContext = wx.createVideoContext('mealRecipeVideo', this);
      if (videoContext && typeof videoContext.play === 'function') videoContext.play();
    },
    handleVideoPlay() { this.triggerEvent('videoplay'); },
    handleVideoPause() { this.triggerEvent('videopause'); },
    handleVideoWaiting() { this.triggerEvent('videowaiting'); },
    handleVideoError() { this.triggerEvent('videoerror'); },
    handleVideoFullscreen(event) { this.triggerEvent('videofullscreen', event.detail || {}); },
    handleMediaError(event) {
      this.triggerEvent('mediaerror', { id: event.currentTarget.dataset.id, src: event.currentTarget.dataset.src });
    },
    handleOpenProduct(event) { this.triggerEvent('openproduct', { id: event.currentTarget.dataset.id }); }
  }
});
