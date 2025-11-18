# Publishing Guide for Leaflet-Geoman-Extended

This guide outlines the steps to publish this package to npm.

## Pre-Publication Checklist

### ✅ Completed

- [x] Project renamed to `leaflet-geoman-extended`
- [x] Repository URLs updated to `https://github.com/mr-wolf-gb/leaflet-geoman-extended`
- [x] Proper attribution added to original Leaflet-Geoman project
- [x] Temporary files and test artifacts removed
- [x] Documentation consolidated and cleaned up
- [x] README updated with installation instructions
- [x] CHANGELOG created
- [x] package.json configured correctly
- [x] License file present (MIT)

### 📋 Before Publishing

- [ ] Run `npm install` to ensure dependencies are correct
- [ ] Run `npm run build` to create distribution files
- [ ] Run `npm run lint` to check code quality
- [ ] Run `npm test` to verify all tests pass (optional)
- [ ] Verify `dist/` folder contains all necessary files
- [ ] Test the package locally using `npm link`
- [ ] Update version number if needed (currently 2.18.3)

## Publishing Steps

### 1. Build the Package

```bash
npm install
npm run build
```

This will create the distribution files in the `dist/` folder:
- `leaflet-geoman.js` - Main bundle
- `leaflet-geoman.min.js` - Minified version
- `leaflet-geoman.css` - Styles
- `leaflet-geoman.d.ts` - TypeScript definitions

### 2. Test Locally (Optional but Recommended)

```bash
# In this project directory
npm link

# In a test project
npm link leaflet-geoman-extended

# Test the package in your test project
# When done, unlink:
npm unlink leaflet-geoman-extended
```

### 3. Login to npm

```bash
npm login
```

Enter your npm credentials when prompted.

### 4. Publish to npm

For first-time publication:

```bash
npm publish
```

For scoped packages (if you want to use a scope):

```bash
npm publish --access public
```

### 5. Verify Publication

After publishing, verify the package is available:

```bash
npm view leaflet-geoman-extended
```

Visit the npm page: https://www.npmjs.com/package/leaflet-geoman-extended

## Post-Publication

### Create a GitHub Release

1. Go to https://github.com/mr-wolf-gb/leaflet-geoman-extended/releases
2. Click "Create a new release"
3. Tag version: `v2.18.3`
4. Release title: `v2.18.3 - Initial Extended Release`
5. Description: Copy from CHANGELOG.md
6. Publish release

### Update Documentation

- Ensure README badges are working
- Verify CDN links (unpkg will automatically serve the package)
- Update any external documentation if needed

## Version Management

This project follows [Semantic Versioning](https://semver.org/):

- **MAJOR** version for incompatible API changes
- **MINOR** version for new functionality (backwards compatible)
- **PATCH** version for bug fixes (backwards compatible)

To update version:

```bash
npm version patch  # 2.18.3 -> 2.18.4
npm version minor  # 2.18.3 -> 2.19.0
npm version major  # 2.18.3 -> 3.0.0
```

Then publish:

```bash
npm publish
git push --tags
```

## Package Contents

The published package includes only the `dist/` folder (as specified in package.json `files` field):

```
leaflet-geoman-extended/
└── dist/
    ├── leaflet-geoman.js
    ├── leaflet-geoman.min.js
    ├── leaflet-geoman.css
    └── leaflet-geoman.d.ts
```

Source code, tests, and documentation are available in the GitHub repository but not included in the npm package to keep it lightweight.

## Troubleshooting

### "You do not have permission to publish"

- Ensure you're logged in: `npm whoami`
- Check package name isn't taken: `npm view leaflet-geoman-extended`
- If name is taken, choose a different name or use a scope: `@your-username/leaflet-geoman-extended`

### "Package name too similar to existing package"

- npm may reject names too similar to existing packages
- Consider using a scope or slightly different name

### Build Errors

```bash
# Clean and rebuild
rm -rf dist node_modules
npm install
npm run build
```

## Support

For issues or questions:
- GitHub Issues: https://github.com/mr-wolf-gb/leaflet-geoman-extended/issues
- Original Project: https://github.com/geoman-io/leaflet-geoman

## License

MIT License - This package maintains the same license as the original Leaflet-Geoman project.
