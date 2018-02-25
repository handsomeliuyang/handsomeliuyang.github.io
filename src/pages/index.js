import React from 'react'
import Helmet from 'react-helmet'

class IndexRoute extends React.Component {
    render(){
        const {title, subtitle} = this.props.data.site.siteMetadata;
        const {edges:posts} = this.props.data.allMarkdownRemark;
        return (
            <div>
                <Helmet>
                    <title>{title}</title>
                    <meta name="description" content={subtitle}/>
                </Helmet>

                <div className="content">
                    <div className="content__inner">
                        {
                            posts
                                // .filter(({node:post}) => post.frontmatter.title.length > 0)
                                .map(({node:post})=>{
                                    console.log('liuyang', post.frontmatter);
                                    return (
                                        <div>
                                            {post.frontmatter.title}
                                        </div>
                                    );
                                })
                        }
                    </div>
                </div>
            </div>
        );
    }
}

export default IndexRoute;

export const pageQuery = graphql`
    query IndexQuery {
        site {
            siteMetadata {
                title
                subtitle
                copyright
                menu {
                    label
                    path
                }
                author {
                    name
                    email
                    telegram
                    github
                }
            }
        }
        allMarkdownRemark(
            limit: 1000,
            sort: { order: DESC, fields: [frontmatter___date] }
        ){
            edges {
                node {
                    frontmatter {
                        title
                        date
                    }
                }
            }
        }
    }
`;