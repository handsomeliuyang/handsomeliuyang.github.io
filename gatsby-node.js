const lost = require('lost');
const path = require('path');
const slash = require('slash');
const pxtorem = require('postcss-pxtorem');

exports.createPages = ({graphql, boundActionCreators})=>{
    const {createPage} = boundActionCreators;

    return new Promise((resolve, reject)=>{
        const postTemplate = path.resolve('./src/templates/post-template.js');

        // 查询所有的markdown，并创建相应的页面
        resolve(
            graphql(`{
                allMarkdownRemark(
                    limit: 1000
                ) {
                    edges {
                        node {
                            fields {
                                slug
                            }
                            frontmatter {
                                category
                            }
                        }
                    }
                }
            }`).then((result)=>{
                if (result.errors) {
                    console.log(result.errors);
                    reject(result.errors)
                }

                // 创建对应的markdown页面
                result.data.allMarkdownRemark.edges.forEach((edge) => {
                    createPage({
                        path: edge.node.fields.slug, // required
                        component: slash(postTemplate),
                        context: {
                            slug: edge.node.fields.slug,
                        },
                    });
                    // let categories = [];
                    // categories = categories.concat(edge.node.frontmatter.category);
                    // categories.forEach((category)=>{
                    //     const categoryPath = `/categories/${category}/`;
                    //     createPage({
                    //         path: categoryPath,
                    //         component: categoryTemplate,
                    //         context: { category }
                    //     });
                    // });
                });

                resolve();
            })
        )
    });
};

exports.onCreateNode = ({ node, boundActionCreators, getNode })=>{
    const { createNodeField } = boundActionCreators;

    if(node.internal.type === "MarkdownRemark" && typeof node.slug === 'undefined') {
        const fileNode = getNode(node.parent);
        const parsedFilePath = path.parse(fileNode.absolutePath);
        let slug = `/${parsedFilePath.dir.split('---')[1]}/`;
        if (typeof node.frontmatter.path !== 'undefined') {
            slug = node.frontmatter.path;
        }

        // 创建slug字段
        createNodeField({
            node,
            name: 'slug',
            value: slug
        });

        // 创建类别字段
        if(typeof node.frontmatter.category !== 'undefined'){
            const categorySlug = `/categories/${node.frontmatter.category}/`;
            createNodeField({ node, name: 'categorySlug', value: categorySlug });
        }
    }
};


exports.modifyWebpackConfig = ({config})=>{
    config.merge({
        postcss: [
            lost(),
            // pxtorem({
            //     rootValue: 16,
            //     unitPrecision: 5,
            //     propList: [
            //         'font',
            //         'font-size',
            //         'line-height',
            //         'letter-spacing',
            //         'margin',
            //         'margin-top',
            //         'margin-left',
            //         'margin-bottom',
            //         'margin-right',
            //         'padding',
            //         'padding-top',
            //         'padding-left',
            //         'padding-bottom',
            //         'padding-right',
            //         'border-radius',
            //         'width',
            //         'max-width'
            //     ],
            //     selectorBlackList: [],
            //     replace: true,
            //     mediaQuery: false,
            //     minPixelValue: 0
            // })
        ]
    });
};