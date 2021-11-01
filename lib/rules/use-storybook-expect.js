/**
 * @fileoverview Use expect from '@storybook/expect'
 * @author Yann Braga
 */
'use strict'

const { docsUrl } = require('../utils')

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = {
  meta: {
    type: 'suggestion',
    fixable: 'code', // Or `code` or `whitespace`,
    hasSuggestions: true,
    docs: {
      description: 'Use expect from `@storybook/jest`',
      category: 'addon-interactions',
      recommended: true,
      recommendedConfig: 'error',
      url: docsUrl('use-storybook-expect'), // URL to the documentation page for this rule
    },
    messages: {
      fixSuggestion: 'Update imports',
      description:
        'Do not use expect from jest directly in the story. You should use from `@storybook/jest` instead.',
    },
  },

  create(context) {
    // variables should be defined here

    //----------------------------------------------------------------------
    // Helpers
    //----------------------------------------------------------------------

    const isPlayFunction = (property) => {
      return property.name === 'play'
    }

    const getExpressionStatements = (body) => {
      return body.filter((b) => b.type === 'ExpressionStatement')
    }

    const isExpect = (expression) => {
      return expression.callee.object.callee.name === 'expect'
    }

    const isExpectFromStorybookImported = (node) => {
      return (
        node.source.value === '@storybook/jest' &&
        node.specifiers.find((spec) => spec.imported.name === 'expect')
      )
    }
    //----------------------------------------------------------------------
    // Public
    //----------------------------------------------------------------------

    let isImportingFromStorybookExpect = false
    let expectInvocations = []

    return {
      ImportDeclaration(node) {
        if (isExpectFromStorybookImported(node)) {
          isImportingFromStorybookExpect = true
        }
      },
      AssignmentExpression(node) {
        const { left, right } = node
        if (isPlayFunction(left.property)) {
          const expressionStatements = getExpressionStatements(right.body.body)
          expressionStatements.forEach(({ expression }) => {
            if (isExpect(expression)) {
              expectInvocations.push(expression)
            }
          })
        }
      },
      'Program:exit': function () {
        if (!isImportingFromStorybookExpect && expectInvocations.length) {
          expectInvocations.forEach((node) => {
            context.report({
              node,
              messageId: 'description',
              fix: function (fixer) {
                return fixer.insertTextAfterRange(
                  [0, 0],
                  "import { expect } from '@storybook/jest';\n"
                )
              },
              suggest: [
                {
                  messageId: 'fixSuggestion',
                  fix: function (fixer) {
                    return fixer.insertTextAfterRange(
                      [0, 0],
                      "import { expect } from '@storybook/jest';\n"
                    )
                  },
                },
              ],
            })
          })
        }
      },
    }
  },
}