import React from 'react'
import LogoImg from './logo.png'
import './style.scss'

class Sidebar extends React.Component {
    render(){
        const {author, title, subtitle, copyright} = this.props.data.site.siteMetadata;

        return (
            <div className="sidebar">
                <div className="sidebar__inner">
                    <div className="sidebar__author">
                        <img
                            src={LogoImg}
                            className="sidebar__author-photo"
                            width="75"
                            height="75"
                            alt={author.name}/>
                        <h1 className="sidebar__author-title">
                            {author.name}
                        </h1>
                        <p className="sidebar__author-subtitle">{subtitle}</p>
                    </div>


                </div>
            </div>
        );
    }
}

export default Sidebar;