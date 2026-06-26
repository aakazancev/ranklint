import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: ['src/index', 'src/schema-org'],
  declaration: true,
  clean: true,
})
