import React from 'react'
import Helmet from 'react-helmet'
import Sidebar from '../components/Sidebar';
import Post from '../components/Post';
import "./style.scss";

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
                <Sidebar {...this.props}/>
                <div className="content">
                    <div className="content__inner">
                        {
                            posts
                                .filter(({node:post}) => post.frontmatter.title.length > 0)
                                .map(({node:post})=>{
                                    return (
                                        <Post data={post} key={post.fields.slug}/>
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
                    fields {
                        slug
                        categorySlug
                    }
                    excerpt
                    frontmatter {
                        title
                        date
                        category
                    }
                }
            }
        }
    }
`;