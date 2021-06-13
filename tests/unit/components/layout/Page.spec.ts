import { shallowMount } from '@vue/test-utils'
import Page from '@/components/layout/Page.vue'

describe('Page', () => {
  it('renders title prop and two slots', () => {
    const wrapper = shallowMount(Page, {
      propsData: { 
        title: 'The title'
      },
      slots: {
        default: 'The body',
        footer: 'The footer'
      }
    })
    const actualText = wrapper.text()
    expect(actualText).toContain('The title')
    expect(actualText).toContain('The body')
    expect(actualText).toContain('The footer')
  })
})
