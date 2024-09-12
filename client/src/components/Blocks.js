import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Block from './Block';

class Blocks extends Component {
    state = { blocks: [], paginatedId: 1 };

    componentDidMount() {
        fetch(`${document.location.origin}/api/blocks`)
        .then(response => response.json())
        .then(json => this.setState({ blocks: json }));
    }

    render() {
        console.log('this.state', this.state);

        return (
            <div>
                <h3>
                    Blocks
                </h3>
                {
                    this.state.blocks.map(block => {
                        return (
                            <div>{block.hash}</div>
                        )
                    })
                }
            </div>
        );
    }
}