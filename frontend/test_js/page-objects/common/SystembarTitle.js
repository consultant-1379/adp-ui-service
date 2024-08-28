const cssPaths = {
  icon: 'eui-icon',
  title: '.product-action',
};

class SystembarTitle {
  constructor(root) {
    this.root = root;
  }

  async ericssonIcon() {
    return this.root.shadow$(cssPaths.icon);
  }

  async title() {
    return this.root.shadow$(cssPaths.title);
  }
}

export default SystembarTitle;
